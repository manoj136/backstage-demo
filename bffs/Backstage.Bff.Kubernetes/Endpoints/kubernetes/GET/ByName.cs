using Backstage.Bff.Kubernetes.Services;
using k8s;

namespace Backstage.Bff.Kubernetes.Endpoints;

internal static partial class KubernetesEndpoints
{
    public static async Task<IResult> DeploymentByName(string deploymentName,string k8sNamespace, 
        IKubernetesService kubernetesService)
    {
        var k8sDeployment = await kubernetesService.GetDeploymentByName(deploymentName, k8sNamespace);
        return Results.Ok(k8sDeployment);
    }
}