using System.Text.Json;

namespace Backstage.Bff.Kubernetes.Services;

public class KubernetesService(IHttpClientFactory httpClientFactory) : IKubernetesService
{
    private readonly IHttpClientFactory httpClientFactory = httpClientFactory;

    public async Task<object> GetDeploymentByName(string deploymentName, string k8sNamespace)
    {
        HttpClient httpClient = httpClientFactory.CreateClient("k8sApiClient");

        var endpoint = 
            string.Format("apis/apps/v1/namespaces/{0}/deployments/{1}", 
            k8sNamespace, 
            deploymentName);

        var response = await httpClient.GetAsync(endpoint);              
        response.EnsureSuccessStatusCode();
        return response.Content.ReadFromJsonAsync<object>();
    }
}


