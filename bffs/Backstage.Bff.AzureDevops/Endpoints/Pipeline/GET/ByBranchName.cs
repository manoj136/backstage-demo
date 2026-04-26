using Backstage.Bff.AzureDevops.Services;
using Microsoft.Extensions.Options;

namespace Backstage.Bff.AzureDevops.Endpoints;

internal static partial class PipelineEndpoints
{   
    public static async Task<IResult> LatestBuildByPipelineIdHavingBranch(string pipelineId,
        string branchName,
        IOptions<AppSettingOptions> options,
        IAzureDevopsPipelineService azureDevopsPipelineService)
    {
        var latestBuild = await azureDevopsPipelineService.GetLatestBuildByPipelineIdHavingBranch(options.Value.ProjectName, pipelineId, branchName);
        return Results.Ok(latestBuild);
    }
}


