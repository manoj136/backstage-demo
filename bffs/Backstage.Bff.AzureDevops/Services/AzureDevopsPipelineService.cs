using Microsoft.TeamFoundation.Build.WebApi;
using System.Web;

namespace Backstage.Bff.AzureDevops.Services;

public class AzureDevopsPipelineService(BuildHttpClient buildClient) : IAzureDevopsPipelineService
{
    private readonly BuildHttpClient buildClient = buildClient;

    public async Task<Build> GetLatestBuildByPipelineId(string projectName, string pipelineId)
    {
        return await buildClient.GetLatestBuildAsync(projectName, pipelineId);       
    }

    public async Task<Build> GetLatestBuildByPipelineIdHavingBranch(string projectName, string pipelineId, string branchName)
    {
        return await buildClient.GetLatestBuildAsync(projectName, pipelineId, branchName.Replace("%2F","/"));
    }

    public async Task<Build> GetBuildAsync(string projectName, int buildId)
    {
        return await buildClient.GetBuildAsync(projectName, buildId);
    }
}

