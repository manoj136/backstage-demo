namespace Backstage.Bff.Kubernetes.Services;

public interface IKubernetesService
{
    Task<object> GetDeploymentByName(string deploymentName, string k8sNamespace);
}

