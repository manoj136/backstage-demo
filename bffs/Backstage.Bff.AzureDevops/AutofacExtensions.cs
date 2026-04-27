using Autofac.Extensions.DependencyInjection;
using Autofac;
using System.Reflection;
using Backstage.Bff.AzureDevops.Services;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;

namespace Backstage.Bff.AzureDevops;

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
                builder.RegisterType<AzureDevopsPipelineService>().As<IAzureDevopsPipelineService>().InstancePerLifetimeScope();

                builder.Register(_ =>
                {
                    var credential = new VssBasicCredential(string.Empty, x.Configuration["AdmGroup:AzureDevOps:PAT"]!);
                    var connection = new VssConnection(new Uri(x.Configuration["AdmGroup:AzureDevOps:OrganizationUrl"]!), credential);
                    return connection.GetClient<BuildHttpClient>();
                });
            }
        );
    }
}

