// Importing necessary components and hooks from Backstage and Material-UI libraries
import React from 'react';
import { useAsync } from 'react-use';
import { Card, CardContent, CardHeader } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import {
  useApi,
} from '@backstage/core-plugin-api';

import {
  catalogApiRef,
  useEntity,
} from '@backstage/plugin-catalog-react';

import {
  InfoCardVariants,
  Link
} from '@backstage/core-components';

import { AboutField } from './AboutField';

const useStyles = makeStyles({
  gridItemCard: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 10px)', // for pages without content header
    marginBottom: '10px',
  },
  fullHeightCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  gridItemCardContent: {
    flex: 1,
  },
  fullHeightCardContent: {
    flex: 1,
  },
  value: {
    fontWeight: 'bold',
    overflow: 'hidden',
    fontSize: '12px',
    wordBreak: 'break-word',
    whiteSpace: 'nowrap',
  },
});

export interface BuildInfoCardProps {
  variant?: InfoCardVariants;
}

// SimpleCard functional component
export function BuildInfoCard(props: BuildInfoCardProps) {
  const { variant } = props;
// Hook to access the entity from the Backstage catalog
  const { entity } = useEntity();
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);

  let cardClass = '';
  if (variant === 'gridItem') {
    cardClass = classes.gridItemCard;
  } else if (variant === 'fullHeight') {
    cardClass = classes.fullHeightCard;
  }

  let cardContentClass = '';
  if (variant === 'gridItem') {
    cardContentClass = classes.gridItemCardContent;
  } else if (variant === 'fullHeight') {
    cardContentClass = classes.fullHeightCardContent;
  }

  // Extracting name and description from the entity metadata
  const name = entity.metadata.name;  
  //namespace: omega-frontoffice-development
  //           adm-omega-frontoffice-api-development
  const namespace = entity.metadata.namespace;
  
  const splittedNamespace = namespace?.split('-');
 
  var resourceEntityName: string ="";

  if(splittedNamespace?.length == 3)
  {
    resourceEntityName = 'build-' + splittedNamespace[1] + '-api-' + name + '-' + splittedNamespace[2];
  }

  if(splittedNamespace?.length == 5)
  {
    resourceEntityName = 'build-' + splittedNamespace[2] + '-api-' + name + '-' + splittedNamespace[4];
  }  

  console.log('Resource entity name: ' + resourceEntityName);

  const responseCatalogEntity = useAsync(
    async () => {
      const response = await catalogApi.getEntities({filter: {
        'metadata.name': resourceEntityName,
      }});

      return response.items[0];
    },[]);

  const entityMetadataGitCommitHashUrl = 'https://dev.azure.com/adm-group/Client%20Frontend/_git/omega-apis/commit/' + responseCatalogEntity.value?.metadata.annotations?.['adm-azure-devops-pipeline-build-commit-hash'];
  const entityMetadataGitBuildUrl = 'https://dev.azure.com/adm-group/Client%20Frontend/_build/results?buildId=' + responseCatalogEntity.value?.metadata.annotations?.['adm-azure-devops-pipeline-build-id'] + '&view=results';
  

  // JSX for rendering the component
  return (
    <Card className={cardClass}>
      <CardHeader  title='Build Info'>
      </CardHeader>
      <Divider />
      <CardContent className={cardContentClass}>
        <Grid container>
          <AboutField 
            label="Last build"             
            gridSizes={{ xs: 12, sm: 6 }} >

              <IconButton
                className={classes.value}
                component={Link}                
                disabled={!entityMetadataGitBuildUrl}
                to={entityMetadataGitBuildUrl ?? '#'}
              >
              { responseCatalogEntity.value?.metadata.annotations?.['adm-azure-devops-pipeline-build-id'] || `unknown` }
              </IconButton>

          </AboutField>          
          
          <AboutField 
            label="Last Build Commit Hash"            
            gridSizes={{ xs: 12, sm: 6}} >

              <IconButton
                className={classes.value}
                component={Link}                
                disabled={!entityMetadataGitCommitHashUrl}
                to={entityMetadataGitCommitHashUrl ?? '#'}
              >
              { responseCatalogEntity.value?.metadata.annotations?.['adm-azure-devops-pipeline-build-commit-hash'] || `unknown` }
              </IconButton>

          </AboutField>

          <AboutField 
            label="Current deployed build" 
            gridSizes={{ xs: 12 }} >
              
              <IconButton
                className={classes.value}
              >
              {responseCatalogEntity.value?.metadata.annotations?.['adm-k8s-apps-deployment-azure-devops-build-id'] || `unknown`} 
              </IconButton>    
              
          </AboutField> 

        </Grid>           
      </CardContent>
    </Card>
  );
}