namespace Backstage.Bff.Kubernetes.Endpoints;

internal static partial class KubernetesEndpoints
{
    public static void AddKubernetesEndpoints(this RouteGroupBuilder x)
    {
        x.MapGet("namespace/{k8sNamespace}/deployments/{deploymentName}", DeploymentByName);
    } 
}
