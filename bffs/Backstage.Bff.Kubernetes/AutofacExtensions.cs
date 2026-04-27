using Autofac.Extensions.DependencyInjection;
using Autofac;
using System.Reflection;
using Backstage.Bff.Kubernetes.Services;

namespace Backstage.Bff.Kubernetes;

public static class AutofacExtensions
{
    public static void AddAutofac(this WebApplicationBuilder x)
    {
        x.Host.UseServiceProviderFactory(new AutofacServiceProviderFactory());

        x.Host.ConfigureContainer<ContainerBuilder>
        (
            builder =>
            {
                builder.RegisterAssemblyModules(Assembly.GetExecutingAssembly());
                builder.RegisterType<KubernetesService>().As<IKubernetesService>().InstancePerLifetimeScope();
                builder.Register(ctx =>
                {
                    var services = new ServiceCollection();
                    services.AddHttpClient("k8sApiClient", httpClient =>
                    {
                        httpClient.BaseAddress = new Uri(x.Configuration["AdmGroup:k8s:BaseAddress"]!);
                        httpClient.DefaultRequestHeaders.Add(
                            "accept", "application/json");
                    });                   

                    var provider = services.BuildServiceProvider();
                    return provider.GetRequiredService<IHttpClientFactory>();

                }).SingleInstance();
            }
        );
    }
}

