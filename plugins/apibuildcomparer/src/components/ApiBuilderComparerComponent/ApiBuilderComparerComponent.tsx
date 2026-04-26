import React from 'react';
import { Grid, Link } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  LinkButton,
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
  } from '@backstage/core-plugin-api';
import {
    catalogApiRef,
  } from '@backstage/plugin-catalog-react';

type Build = {
    name: string;
    lastbuild: string;
    runningbuild: string;
  };

type DenseTableProps = {
    builds: Build[];
  };

export const DenseTable = ({ builds }: DenseTableProps) => {
 
    const columns: TableColumn[] = [
      { title: 'API Name', field: 'name' },
      { title: 'Last Build', field: 'lastbuild' },
      { title: 'Current Running Build', field: 'runningbuild' },
    ];
  
    const data = builds.map(build => {
        const href = 'https://dev.azure.com/adm-group/Client%20Frontend/_build/results?buildId=x&view=results';
  
      return {        
        name: (  
            <Link component={LinkButton} to={href.replace('x', build.lastbuild)} target="_blank" rel="noopener">
                  {build.name || 'unknown'}
            </Link>
        ),
        lastbuild: build.lastbuild,
        runningbuild: build.runningbuild,
      };
    });
  
    return (
      <Table
        title=""
        options={{ search: false, paging: true }}
        columns={columns}
        data={data}
      />
    );
  };

export const ApiBuilderComparerPage = () => {
    const catalogApi = useApi(catalogApiRef);

    const { value, loading, error } = useAsync(async (): Promise<Build[]> => {        
        let builds: Build[] = [];
        const response = await catalogApi.getEntities({filter: {
            'metadata.annotations.type': 'azure-devops-build-pipeline',
            }});

            for(const item of response.items)
            {
                const lastBuild = item.metadata.annotations?.['adm-azure-devops-pipeline-build-id'];
                const runningBuild = item.metadata.annotations?.['adm-k8s-apps-deployment-azure-devops-build-id'];                

                if(lastBuild != runningBuild)
                {
                    const newBuild: Build = {
                        name: item.metadata.name,
                        lastbuild: lastBuild || 'unknown',
                        runningbuild: runningBuild || 'unknown'
                    };
    
                    builds.push(newBuild); 
                }    
            };

            return builds;
      }, []);

    
      if (loading) {
        return <Progress />;
      } else if (error) {
        return <ResponseErrorPanel error={error} />;
      }
    
return(
  <Page themeId="dark">
    <Header title="Build Information" subtitle="">
    </Header>
    <Content>
      <ContentHeader title="">
      </ContentHeader>
      <Grid container spacing={3} direction="column">        
        <Grid item>
          <DenseTable builds={value || []} />
        </Grid>
      </Grid>
    </Content>
  </Page>
)};
