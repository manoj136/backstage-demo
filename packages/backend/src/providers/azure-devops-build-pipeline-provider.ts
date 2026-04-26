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

/**
 * Provides entities 
 */
export class azureDevOpsBuildPipelineProvider implements EntityProvider {
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
    return 'AzureDevOpsBuildPipelineProvider';
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
    const config = this.config.getConfig('custom-providers.integrations.azure-devops-pipeline'); 
    const remote = config.getString('remote');
    const target = config.getString('target');
    const aureDevopsPipelineBff = config.getString('aure-devops-pipeline-bff');
    const aureK8sBff = config.getString('aure-k8s-bff');
    

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

        const url = backendUrl + '/api/catalog/entities?filter=kind=resource,metadata.annotations.type=azure-devops-build-pipeline';
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
            if (resourceEntity.metadata.annotations?.type?.includes('pipeline')) 
              { 
                const splittedResourceEntity = resourceEntity.metadata.name.split("-");
                
                var k8sDeploymentName: string = "";
                var environmentName: string = "";
                var k8sDeploymentNamespace: string = "";  
    
                if(splittedResourceEntity[1] == 'frontoffice')
                {
                    if(splittedResourceEntity[2] == 'api')
                    {
                      ////build-frontoffice-api-articles-development
                      console.log("*****************Inside Frontoffice API condition....*****************");
                      k8sDeploymentName = splittedResourceEntity[3];
                      environmentName =  splittedResourceEntity[4];
                      k8sDeploymentNamespace = "adm-omega-frontoffice-api-" + environmentName;  
        
                      console.log("K8s deployment name: " + k8sDeploymentName);
                      console.log("Environment name: " + environmentName);
                      console.log("K8s deployment namespace: " + k8sDeploymentNamespace);
                    }
        
                    if(splittedResourceEntity[2] == 'trigger')
                    {
                      console.log("*****************Inside Frontoffice TRIGGER condition....*****************");
        
                      //Pattern: build-frontoffice-trigger-cart-development
                      if(splittedResourceEntity.length == 5)
                      {
                        k8sDeploymentName = splittedResourceEntity[3];
                        environmentName =  splittedResourceEntity[4];
                        k8sDeploymentNamespace = "adm-omega-frontoffice-trigger-" + environmentName;  
                      }
        
                      //Pattern: build-frontoffice-trigger-article-images-development
                      if(splittedResourceEntity.length == 6)
                      {
                        k8sDeploymentName = splittedResourceEntity[3] + '-' + splittedResourceEntity[4];
                        environmentName =  splittedResourceEntity[5];
                        k8sDeploymentNamespace = "adm-omega-frontoffice-trigger-" + environmentName;  
                      }
        
                      //Pattern: build-frontoffice-trigger-check-cart-email-development
                      if(splittedResourceEntity.length == 7)
                      {
                        k8sDeploymentName = splittedResourceEntity[3] + '-' + splittedResourceEntity[4] + '-' + splittedResourceEntity[5];
                        environmentName =  splittedResourceEntity[6];
                        k8sDeploymentNamespace = "adm-omega-frontoffice-trigger-" + environmentName;  
                      }
                      
                      console.log("K8s deployment name: " + k8sDeploymentName);
                      console.log("Environment name: " + environmentName);
                      console.log("K8s deployment namespace: " + k8sDeploymentNamespace);
                    }
                }
    
                if(splittedResourceEntity[1] == 'infra')
                {
                    if(splittedResourceEntity[2] == 'api')
                    {
                      //build-infra-api-uniqueidentification-development
                      console.log("*****************Inside Infra API condition....*****************");
                      k8sDeploymentName = splittedResourceEntity[3];
                      environmentName =  splittedResourceEntity[4];
                      k8sDeploymentNamespace = "adm-omega-infra-api-" + environmentName;  
        
                      console.log("K8s deployment name: " + k8sDeploymentName);
                      console.log("Environment name: " + environmentName);
                      console.log("K8s deployment namespace: " + k8sDeploymentNamespace);
                    }
    
                    if(splittedResourceEntity[2] == 'trigger')
                    {
                      console.log("*****************Inside Infra TRIGGER condition....*****************");
              
                      //Pattern: build-infra-trigger-email-service-development
                      if(splittedResourceEntity.length == 6)
                      {
                        k8sDeploymentName = splittedResourceEntity[3] + '-' + splittedResourceEntity[4];
                        environmentName =  splittedResourceEntity[5];
                        k8sDeploymentNamespace = "adm-omega-infra-trigger-" + environmentName;  
                      }
        
                      //Pattern: build-infra-trigger-legacy-cache-etl-status-development
                      if(splittedResourceEntity.length == 8)
                      {
                        k8sDeploymentName = splittedResourceEntity[3] + '-' + splittedResourceEntity[4] + '-' + splittedResourceEntity[5] + '-' + splittedResourceEntity[6];
                        environmentName =  splittedResourceEntity[7];
                        k8sDeploymentNamespace = "adm-omega-infra-trigger-" + environmentName;  
                      }
                      
                      console.log("K8s deployment name: " + k8sDeploymentName);
                      console.log("Environment name: " + environmentName);
                      console.log("K8s deployment namespace: " + k8sDeploymentNamespace);
                    }
    
                    if(splittedResourceEntity[2] == 'idp')
                    {
                      //build-infra-idp-abi-development
                      console.log("*****************Inside Infra IDP condition....*****************");
                      k8sDeploymentName = splittedResourceEntity[3];
                      environmentName =  splittedResourceEntity[4];
                      k8sDeploymentNamespace = "adm-omega-infra-idp-" + environmentName;  
        
                      console.log("K8s deployment name: " + k8sDeploymentName);
                      console.log("Environment name: " + environmentName);
                      console.log("K8s deployment namespace: " + k8sDeploymentNamespace);
                    }
                }
    
                //#####################################################################################
                //Calling azure devop build pipeline bff to get a latest build for the resource entity
                //#####################################################################################
                const aureDevopsPipelineBffUrl = aureDevopsPipelineBff.replace("{pipeline-id}", resourceEntity.metadata.annotations?.['adm-azure-devops-pipeline-id']).replace("{branch-name}", "env%2F" + environmentName);
                console.log('Azure devops pipeline bff url: ' + aureDevopsPipelineBffUrl);
    
                const res = await fetch(aureDevopsPipelineBffUrl, 
                {
                  method: 'get',
                });
    
                const azureDevopsBuildInfo = await res.json();
                console.log('***************Azure Devops build found: ' + JSON.stringify(azureDevopsBuildInfo)); 
    
                //#####################################################################################
                //Calling azure k8s  bff to get a latest build for the resource entity
                //#####################################################################################          
                const aureK8sBffUrl = aureK8sBff.replace("{k8s-namespace}", k8sDeploymentNamespace).replace("{deployment-name}",k8sDeploymentName);
                console.log('Azure k8s bff url: ' + aureK8sBffUrl);
    
                const resp = await fetch(aureK8sBffUrl, 
                {
                  method: 'get',
                });
    
                const azureK8sDeploymentInfo = await resp.json();
                console.log('***************Azure K8s Deployment Found: ' + JSON.stringify(azureK8sDeploymentInfo)); 
    
                //#####################################################################################
                
                const entityLastBuildId = resourceEntity.metadata.annotations?.['adm-azure-devops-pipeline-build-id'];
                const azureDevopsLastBuildId = azureDevopsBuildInfo.id + "";
                const azureDevopsLastBuildCommitHash = azureDevopsBuildInfo.sourceVersion;
    
                console.log("Resourse manifest last build id: " + entityLastBuildId);
                console.log("Azure devops pipeline last build id: " + azureDevopsLastBuildId);
                console.log("Azure devops pipeline last build commit hash: " + azureDevopsLastBuildCommitHash);
    
                const entityLastDevOpsBuildId = resourceEntity.metadata.annotations?.['adm-k8s-apps-deployment-azure-devops-build-id'];
                const k8sLastDevOpsBuildId = azureK8sDeploymentInfo.result.metadata.labels?.['app.kubernetes.io/version'] + "";
                console.log("Resourse manifest devops last build id: " + entityLastDevOpsBuildId);
                console.log("K8s devops last build id: " + k8sLastDevOpsBuildId);
    
                console.log('resource manifest ** ' + resourceEntity.metadata.name + ' ** editing started!');
                
                //Resource manifest local filepath
                var resourceManifestLocalPath: string = "";
                
                if(splittedResourceEntity[2] == 'api')
                {
                  resourceManifestLocalPath = target + '/resources/pipelines/' + splittedResourceEntity[1] + '/apis/' + resourceEntity.metadata.name +'-catalog-info.yaml';
                }
    
                if(splittedResourceEntity[2] == 'trigger')
                {
                  resourceManifestLocalPath = target + '/resources/pipelines/' + splittedResourceEntity[1] + '/triggers/' + resourceEntity.metadata.name +'-catalog-info.yaml';
                }
    
                if(splittedResourceEntity[2] == 'idp')
                {
                  resourceManifestLocalPath = target + '/resources/pipelines/' + splittedResourceEntity[1] + '/idps/' + resourceEntity.metadata.name +'-catalog-info.yaml';
                }
               
                console.log("Resource manifest local path: " + resourceManifestLocalPath);           
    
                //Loading the resource yaml file for updation
                const resourceManifest = yaml.load(fs.readFileSync(resourceManifestLocalPath, 'utf8')); 
    
                //Compare resource manifest & azure devops build info for version difference
    
                //1. Last build id check
                if(entityLastBuildId != azureDevopsLastBuildId)
                {
                  resourceManifest['metadata']['annotations']['adm-azure-devops-pipeline-build-id'] =  azureDevopsLastBuildId;
                }
    
                resourceManifest['metadata']['annotations']['adm-azure-devops-pipeline-build-commit-hash'] =  azureDevopsLastBuildCommitHash;
                
                //2. Last deployed id check
                if(entityLastDevOpsBuildId != k8sLastDevOpsBuildId)
                {
                  resourceManifest['metadata']['annotations']['adm-k8s-apps-deployment-azure-devops-build-id'] =  k8sLastDevOpsBuildId;
                }
    
                console.log(resourceManifest);  
                //Dumping the updated resource file          
                fs.writeFileSync(resourceManifestLocalPath, yaml.dump(resourceManifest, { sortKeys: false }));
                console.log('resource manifest ** ' + resourceEntity.metadata.name + ' ** editing done!');
              } 
          }catch(e)
          {
            console.error('Azure Devops Build Pipeline Provider Error: ' + e);
          }                  
        }

        if(repoExists)
        { 
          const git: SimpleGit = simpleGit(target);
          await git.addConfig('user.name', 'Architecture Integrations');
          await git.addConfig('user.email', 'ArchitectureIntegrations@admgroup.com');
          await git.add('.');  
          await git.status();
          await git.commit('Backstage->AzureDevopsBuildPipelineEntityProvider: Resource manifest edited!');
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
      console.error('****Error occured while processing azure devops build pipeline resources: ' + e);
   }
  }
}