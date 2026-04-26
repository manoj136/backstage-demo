import React from 'react';
import { Grid, Link } from '@material-ui/core';
import { Card, CardContent, Typography } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  TableFilter,
} from '@backstage/core-components';

import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import {
    useApi,
    configApiRef
  } from '@backstage/core-plugin-api';
import {
    catalogApiRef,
  } from '@backstage/plugin-catalog-react';

type Component = {
    name: string;
    targetRef: string;
    namespace: string;
    environment: string;
  };

type License = {
    name: string;
    createdOn: string;
    expiresOn: string;
    environment: string[]; //string;
    components: Component[]
  };

type DenseTableProps = {
    licenses: License[];
  };

export const DenseTable = ({ licenses }: DenseTableProps) => {
    const columns: TableColumn[] = [
      { title: 'Name', field: 'name', cellStyle: { textTransform: 'uppercase'} },
      { title: 'Added date', field: 'createdOn', type: 'date' },
      { title: 'Expiration date', field: 'expiresOn', type: 'string'},     
      { title: 'Environment', field: 'environment', type: 'string', hidden: true },
    ];
  
    const data = licenses.map(license => {       
      return {    
        name: license.name,
        createdOn: license.createdOn,
        expiresOn: license.expiresOn,
        environment: ['development','production', 'sandbox', 'staging', 'test', 'uat'],  //license.environment,
        components: license.components
      };
    }); 

    const filters: TableFilter[] = [{
        column: 'Environment',
        type: 'select',
      }];
  
    return (
      <Table
        title=""
        initialState={{filtersOpen: true, filters: { Environment: 'production',
        }  }}
        options={{ search: false, paging: true,pageSize: 50, pageSizeOptions: [10, 25, 50, 100] }}
        columns={columns}
        data={data} 
        detailPanel={[
            {
                render: rowData => {
                    const row = rowData.rowData as unknown as License;
                    const configApi = useApi(configApiRef);
                    const appConfig = configApi.getConfig('app');
                    const appBaseUrl = appConfig.getOptionalString('baseUrl');
                    let filteredComponents: Component[] = [];
                  
                    let value = (document.getElementById('root') as HTMLElement).innerHTML;

                    let regex = new RegExp('<p class="MuiTypography-root-\\d+ MuiTypography-body1-\\d+">\\w+<\/p>', "i");
                    let match = regex.exec(value);

                    if(match)
                    {
                      let text = match![0];
                      console.log('Regex Matcher: ' + match![0]);
  
                      let environment = text!.match(/>(.*?)</)![1];
                      console.log('######## Environment : ' + environment);

                      filteredComponents = row.components.filter((component) => 
                          component.environment == environment);

                      console.log('################ Filtered Components: ' + JSON.stringify(filteredComponents));
                    } 
                    else
                    {
                      filteredComponents = row.components;
                    }                 
                    
                    console.log('##### Environment Filter Value: ' + value);
                    
                    const targetRefEntity = appBaseUrl + '/catalog/{namespace}/component/{entity-name}';
                    console.log('Detailed Row Data: ' + JSON.stringify(row));
                  return (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Related Component(s)</Typography>
                           
                            {filteredComponents.map((component) => (                              
                                <Typography color="textSecondary" gutterBottom>
                                    <Link href={targetRefEntity.replace('{namespace}',component.namespace).replace('{entity-name}', component.name)} 
                                      target="_blank" 
                                      rel="noopener noreferrer">
                                        {component.name}
                                    </Link> 
                                </Typography>
                            ))}   
                        </CardContent>
                    </Card>               
                  )
                },
              }
        ]}
        filters={filters}
        emptyContent={<div style={{ textAlign: 'center' }}>
            No record(s) avaliable.           
          </div>}
      />
    );
  };
  
function monthDiff(d1: Date, d2: Date): number {
  const years = d2.getFullYear() - d1.getFullYear();
  const months = d2.getMonth() - d1.getMonth();
  return years * 12 + months;
}

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const LicensesComponent = () => {
    const catalogApi = useApi(catalogApiRef);
    //const config = useApi(configApiRef);

    const licenseCertExpiryAlertInterval = '1'; //config.getString('security.licensesCertsExpiryThresholdALert');

    console.log('******************ALERT - License cert expiry interval(months): ' + Number(licenseCertExpiryAlertInterval));

    const { value, loading, error } = useAsync(async (): Promise<License[]> => {        
        let licenses: License[] = [];

        const response = await catalogApi.getEntities({filter: {
            'spec.type': 'license',
            }});

            console.log('Licenses: ' + JSON.stringify(response.items));

            for(const item of response.items)
            {
                let components : Component[] = [];

                item.relations?.map(relation => {                   
                    if(relation.type == 'dependencyOf')
                    {
                        const newComponent : Component = {
                            name: relation.targetRef.split('/')[1],
                            targetRef: relation.targetRef,
                            namespace: relation.targetRef.split('/')[0].split(':')[1],
                            environment: relation.targetRef.split('/')[0].split(':')[1].split('-')[2] //omega-infra-development
                        };                       

                        components.push(newComponent);
                    }
                });
                
                const newLicense: License = {
                    name: ((monthDiff(new Date(formatDateToYYYYMMDD(new Date(item.metadata.annotations?.['expiresOn'] + ""))),new Date()) >= Number(licenseCertExpiryAlertInterval)) && (new Date(item.metadata.annotations?.['expiresOn'] + "").toDateString() != 'Thu Jan 01 1970')) 
                          ? '⚠️' + ' ' + item.metadata.name 
                          : item.metadata.name,
                    createdOn: new Date(item.metadata.annotations?.['createdOn'] + "").toLocaleString(),                                     
                    expiresOn: (new Date(item.metadata.annotations?.['expiresOn'] + "").toDateString() == 'Thu Jan 01 1970') ? "No expiration" : new Date(item.metadata.annotations?.['expiresOn'] + "").toLocaleString(),
                    environment: [],// dummy value set
                    components: components
                };
                
               licenses.push(newLicense); 
            };

            console.log('****Licenses Infomation: ' + JSON.stringify(licenses));
            return licenses;
      }, []);

    
      if (loading) {
        return <Progress />;
      } else if (error) {
        return <ResponseErrorPanel error={error} />;
      }
    
return(
  <Page themeId="dark">
    <Header title="Licenses Information" subtitle="">
    </Header>
    <Content>
      <ContentHeader title="">
      </ContentHeader>
      <Grid container spacing={3} direction="column">        
        <Grid item>
          <DenseTable licenses={value || []}  />
        </Grid>
        ⚠️ = License expired or expiring soon!
      </Grid>
    </Content>
  </Page>
)};

