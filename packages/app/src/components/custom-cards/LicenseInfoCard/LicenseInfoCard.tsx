// Importing necessary components and hooks from Backstage and Material-UI libraries
import React from 'react';
import { useAsync } from 'react-use';
import { Grid } from '@material-ui/core';
import {
  useApi,
} from '@backstage/core-plugin-api';

import {
  catalogApiRef,
  useEntity,
} from '@backstage/plugin-catalog-react';

import {
  Table,
  TableColumn,
} from '@backstage/core-components';

interface License {
    name: string,
    createdOn: string,
    expiredOn: string
};

type DenseTableProps = {
  licenses: License[];
};

export const DenseTable = ({ licenses }: DenseTableProps) => {
  const columns: TableColumn[] = [
    { title: 'Name', field: 'name' },
    { title: 'Added date', field: 'createdOn', type: 'date' },
    { title: 'Expiration date', field: 'expiresOn', type: 'string' },
  ];

  const data = licenses.map(license => {       
    return {     
      name: license.name,
      createdOn: license.createdOn,
      expiresOn: license.expiredOn
    };
  }); 

  return (
    <Table
      title=""
      options={{ search: false, paging: true }}
      columns={columns}
      data={data} 
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

export const LicenseInfoCard = () =>{

// Hook to access the entity from the Backstage catalog
  const { entity } = useEntity();
  const catalogApi = useApi(catalogApiRef);  
  //const config = useApi(configApiRef);

  const licenseCertExpiryAlertInterval = '1'; //config.getString('security.licensesCertsExpiryThresholdALert');

  console.log('******************ALERT - License cert expiry interval(months): ' + Number(licenseCertExpiryAlertInterval));


  const associatedResources: string[] = entity.spec?.dependsOn as string[];

  console.log('components dependencies: ' + JSON.stringify(associatedResources));

  let licenses: License[] = [];

  if(associatedResources?.length)
  {
    for(var i = 0;i<associatedResources.length;i++) {
        console.log('Resource dependency: ' + associatedResources[i].split('/')[1]); 
    
        const licenseResourceName = associatedResources[i].split('/')[1];
    
        if(licenseResourceName.includes('license'))
        {
            const associatedLicenses = useAsync(
                async () => {
                    const response = await catalogApi.getEntities({filter: {
                    'metadata.name': licenseResourceName,
                    }});
            
                    return response.items[0];
            },[]);
    
            const newLicense: License = {
                name: ((monthDiff(new Date(formatDateToYYYYMMDD(new Date(associatedLicenses.value?.metadata.annotations?.['expiresOn'] + ""))),new Date()) >= Number(licenseCertExpiryAlertInterval)) && (new Date(associatedLicenses.value?.metadata.annotations?.['expiresOn'] + "").toDateString() != 'Thu Jan 01 1970')) 
                ? '⚠️' + ' ' + associatedLicenses.value?.metadata.name 
                : associatedLicenses.value?.metadata.name || 'unknown',
                createdOn: new Date(associatedLicenses.value?.metadata.annotations?.['createdOn'] + "").toLocaleString(),
                expiredOn: (new Date(associatedLicenses.value?.metadata.annotations?.['expiresOn']+ "").toDateString() == 'Thu Jan 01 1970') ? "No expiration" : new Date(associatedLicenses.value?.metadata.annotations?.['expiresOn'] + "").toLocaleString()
            };
    
            licenses.push(newLicense);
        }    
      };
  }

  console.log('Licenses array: ' + JSON.stringify(licenses));

  // JSX for rendering the component
  return (
    <Grid container spacing={3} direction="column" xs={12}>        
      <Grid item>
        <DenseTable licenses={licenses || []}  />
      </Grid>
      ⚠️ = License expired or expiring soon!
    </Grid>         
  );
}