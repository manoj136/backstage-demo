//@ts-nocheck
import { 
    Entity, 
} from '@backstage/catalog-model';

import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';

import {
  AuthService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';

import { Config } from '@backstage/config';

import { simpleGit, SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

import { match } from 'lodash';
import { Buffer } from 'buffer';
import { X509Certificate } from 'crypto';

import * as xml2js from 'xml2js'; 

/**
 * Provides entities 
 */
export class azureKeyVaultProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private taskRunner: SchedulerServiceTaskRunner;
  private config: Config;
  private httpAuth: AuthService;

  /** [1] */
  constructor(
    taskRunner: SchedulerServiceTaskRunner,
    config: Config,
    httpAuth: AuthService,
  ) {
    this.taskRunner = taskRunner;
    this.config = config;
    this.httpAuth = httpAuth;
  }

  /** [2] */
  getProviderName(): string {
    return 'azureKeyVaultProvider';
  }

  /** [3] */
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: this.getProviderName(),
      fn: async () => {
        await this.run();
      },
    });
  }

  /** [4] */
  async run(): Promise<void> {
    if (!this.connection) 
    {
        throw new Error('Connection not initialized');
    }

    // This is the place to spawn your entities
    console.log(`######################################################################`);
    console.log(`Refreshing ${this.getProviderName()}`);

    const backendUrl = this.config.getString('backend.baseUrl');
    const config = this.config.getConfig('custom-providers.integrations.azure-key-vault'); 
    const remote = config.getString('remote');
    const target = config.getString('target');
    const aureKeyVaultBff = config.getString('aure-key-vault-bff');

    const repoExists = fs.existsSync(target);

    try
    {
        if(!repoExists)
        {  
          console.log('******************Git cloning start******************');
          // use git instance to do the clone
          await simpleGit().clone(remote,target);
          console.log('******************Git cloning end******************');
        }

        //Generate auth token to access backstage apis
        //More details: https://backstage.io/docs/backend-system/core-services/auth/
        const token  = await this.httpAuth.getPluginRequestToken(
        {
          onBehalfOf: await this.httpAuth.getOwnServiceCredentials(),
          targetPluginId: 'catalog',
        });  
       
        console.log('Bearer Token: ' + token.token);

        const url = backendUrl + '/api/catalog/entities?filter=kind=resource,spec.type=license,spec.type=certificate';
        const response = await fetch(url, 
        {
          method: 'get',
          headers: 
          {
            Authorization: 'Bearer ' + token.token,
          }
        });

        const resourceEntities: Entity[] = await response.json();

        console.log('Total Resources entities found: ' + resourceEntities.length);
        
        //Loop through each of the resourc entities
        for (const resourceEntity of resourceEntities) 
        {        
          try
          {
            if (resourceEntity.metadata.name.includes('license') || resourceEntity.metadata.name.includes('certificate')) 
            { 
              //Calling azure key vault bff to get a secret for the resource entity
              const aureKeyVaultBffUrl = aureKeyVaultBff.replace("{secret-name}", resourceEntity.metadata.name);
              console.log('Azure key vault bff url: ' + aureKeyVaultBffUrl);
  
              const res = await fetch(aureKeyVaultBffUrl, 
              {
                method: 'get',
              });  
              
              const secret = await res.json();
              console.log('***************Secret found: ' + JSON.stringify(secret)); 
  
              if(secret?.value)
              {
                const entityCreationDate = new Date(resourceEntity.metadata.annotations?.createdOn + "");
                const secretCreationDate = new Date(secret.value.properties.createdOn);
    
                const entityExpireDate = new Date(resourceEntity.metadata.annotations?.expiresOn + "");

                const pattern = /-----BEGIN CERTIFICATE-----(.*?)-----END CERTIFICATE-----/s;
                const matchResult = secret.value.value.match(pattern);  
                var certificateOrLicenseActualExpiresOn: string = "";         
                if (matchResult) {
                    const certificateContent = matchResult[1].trim();
                
                    const certBytes = Buffer.from(certificateContent, 'base64');
                    const cert = new X509Certificate(certBytes);
                
                    certificateOrLicenseActualExpiresOn = cert.validTo;
                    console.log('Certificate actual expiry date: ' + certificateOrLicenseActualExpiresOn);
                }
                else if(secret.value.name == 'aspose-cells-license')
                {
                    const parser = new xml2js.Parser(); 
                    const xml = secret.value.value.replace("\\n", "").replace("\n", "")
                    console.log('******** ASPOSE XML: ' + xml.replace("\n", ""));
                    parser.parseString(xml, (err, result) => { 
                      if (err) { 
                          throw new Error('Failed to parse XML: ' + err); 
                      } 
                      console.log("************** result.license XML: " + result.License);
                      console.log("************** result.license.Data XML: " + JSON.stringify(result.License.Data));
                      const licenseInfoXml = result.License.Data;

                      const rawDate = licenseInfoXml[0].SubscriptionExpiry.toString();
                      // Extract year, month, and day
                      const year = parseInt(rawDate.substring(0, 4), 10);
                      const month = parseInt(rawDate.substring(4, 6), 10) - 1; // JS months are 0-based
                      const day = parseInt(rawDate.substring(6, 8), 10);

                      // Create a Date object
                      const date = new Date(year, month, day);

                      certificateOrLicenseActualExpiresOn = date.toString(); 
                  
                      console.log('################# aspose-cells-license expiry: ' + certificateOrLicenseActualExpiresOn); 
                  }); 
                }
                else if(secret.value.value.indexOf('.') !== -1) //JWT token
                {
                  const arrayToken = secret.value.value.split('.');
                  const tokenPayload = JSON.parse(atob(arrayToken[1]));
                  console.log('**** Certs/Licenses with JWT Signature payload: ' + JSON.stringify(tokenPayload)); 
                  
                  const seconds = tokenPayload?.exp;
                  const date = new Date(seconds * 1000);
                  console.log('**** Certs/Licenses with JWT Signature expiry date: ' + date.toString()); 
                  certificateOrLicenseActualExpiresOn = date.toString();
                }
                else
                {
                    certificateOrLicenseActualExpiresOn = secret.value.properties.expiresOn;
                }

                const secretExpireDate = new Date(certificateOrLicenseActualExpiresOn);
    
                console.log('resource manifest ** ' + resourceEntity.metadata.name + ' ** editing started!');
    
                
                //Resource manifest local filepath
                var resourceManifestLocalPath:string ="";
    
                if(resourceEntity.metadata.name.includes('license'))
                {
                  resourceManifestLocalPath = target +'/resources/licenses/' + resourceEntity.metadata.name +'-catalog-info.yaml';
                }
              
                if(resourceEntity.metadata.name.includes('certificate'))
                {
                  resourceManifestLocalPath = target +'/resources/certificates/' + resourceEntity.metadata.name +'-catalog-info.yaml';
                }
    
                //Loading the resource yaml file for updation
                const resourceManifest = yaml.load(fs.readFileSync(resourceManifestLocalPath, 'utf8')); 
    
                //Compare resource manifest & secret for version difference
    
                //1. Secret creation date check
                if(entityCreationDate.toISOString() != secretCreationDate.toISOString())
                {
                  resourceManifest['metadata']['annotations']['createdOn'] = secretCreationDate;
                }
    
                //2. Secret expiration date check
                if(entityExpireDate.toISOString() != secretExpireDate.toISOString())
                {            
                  resourceManifest['metadata']['annotations']['expiresOn'] = secretExpireDate;
                }
                
                console.log(resourceManifest);  
                //Dumping the updated resource file          
                fs.writeFileSync(resourceManifestLocalPath, yaml.dump(resourceManifest, { sortKeys: false }));
                console.log('resource manifest ** ' + resourceEntity.metadata.name + ' ** editing done!');
                }   
              }

              // Refreshing the entity
              const response = await fetch(backendUrl + '/api/catalog/refresh', 
              {
                method: 'post',
                body: {
                  "entityRef": resourceEntity
                },
                headers: 
                {
                  Authorization: 'Bearer ' + token.token,
                }
              });
          }
          catch(e)
          {
            console.error('Azure Key Vault Provider Error: ' + e);
          }                          
        }

        if(repoExists)
        { 
          const git: SimpleGit = simpleGit(target);
          await git.addConfig('user.name', 'Architecture Integrations');
          await git.addConfig('user.email', 'ArchitectureIntegrations@admgroup.com');
          await git.add('.');  
          await git.status();
          await git.commit('Backstage->AzureKeyVaultEntityProvider: Resource manifest edited!');
          await git.push();    
          
          //Deleting target directory
          fs.rmSync(target, { recursive: true, force: true });
          console.log("Cloned target directory deleted!");  
        }
    }
    catch (e) 
    {
      if(repoExists)
      {
        fs.rmSync(target, { recursive: true, force: true });
        console.log("Cloned target directory deleted!"); 
      }

      /* handle all errors here */
      console.error('****Error occured while processing azure key vault secret resources: ' + e);
   }
  }
}