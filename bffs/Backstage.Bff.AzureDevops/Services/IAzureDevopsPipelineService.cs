using Microsoft.TeamFoundation.Build.WebApi;

namespace Backstage.Bff.AzureDevops.Services;

public interface IAzureDevopsPipelineService
{
    Task<Build> GetLatestBuildByPipelineId(string projectName, string pipelineId);
    Task<Build> GetLatestBuildByPipelineIdHavingBranch(string projectName, string pipelineId, string branchName);
    Task<Build> GetBuildAsync(string projectName, int buildId);
}

