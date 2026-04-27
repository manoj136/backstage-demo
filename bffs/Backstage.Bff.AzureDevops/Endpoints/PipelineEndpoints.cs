namespace Backstage.Bff.AzureDevops.Endpoints;

internal static partial class PipelineEndpoints
{
    public static void AddPipelineEndpoints(this RouteGroupBuilder x)
    {
        x.MapGet("pipelines/{pipelineId}/builds/latest", LatestBuildByPipelineId);
        x.MapGet("pipelines/{pipelineId}/branch/{branchName}/builds/latest", LatestBuildByPipelineIdHavingBranch);
        //x.MapGet("builds/{buildId}", BuildById);
    }
}
