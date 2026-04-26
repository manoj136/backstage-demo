using Backstage.Bff.AzureDevops.Services;
using Microsoft.Extensions.Options;

namespace Backstage.Bff.AzureDevops.Endpoints;

internal static partial class PipelineEndpoints
{
    public static async Task<IResult> LatestBuildByPipelineId(string pipelineId,
        IOptions<AppSettingOptions> options,
        IAzureDevopsPipelineService azureDevopsPipelineService)
    {
        var latestBuild = await azureDevopsPipelineService.GetLatestBuildByPipelineId(options.Value.ProjectName, pipelineId);
        return Results.Ok(latestBuild);
    }

    public static async Task<IResult> BuildById(int buildId,
        IOptions<AppSettingOptions> options,
        IAzureDevopsPipelineService azureDevopsPipelineService)
    {
        var build = await azureDevopsPipelineService.GetBuildAsync(options.Value.ProjectName, buildId);
        return Results.Ok(build);
    }
}
