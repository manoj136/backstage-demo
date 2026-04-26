using Autofac.Extensions.DependencyInjection;
using Autofac;
using System.Reflection;
using Backstage.Bff.AzureKeyVault.Services;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using Azure.Security.KeyVault.Certificates;

namespace Backstage.Bff.AzureKeyVault;

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
                builder.RegisterType<AzureKeyVaultService>().As<IAzureKeyVaultService>().InstancePerLifetimeScope();

                builder.Register(s => new SecretClient(new Uri(x.Configuration["AdmGroup:AzureKeyVault:VaultURI"]!),
                                new ClientSecretCredential(
                                    tenantId: x.Configuration["AdmGroup:AzureKeyVault:TenantId"]!,
                                    clientId: x.Configuration["AdmGroup:AzureKeyVault:ClientId"]!,
                                    clientSecret: x.Configuration["AdmGroup:AzureKeyVault:ClientSecret"]!
                                    ))).SingleInstance();

                builder.Register(c => new CertificateClient(new Uri(x.Configuration["AdmGroup:AzureKeyVault:VaultURI"]!),
                                new ClientSecretCredential(
                                    tenantId: x.Configuration["AdmGroup:AzureKeyVault:TenantId"]!,
                                    clientId: x.Configuration["AdmGroup:AzureKeyVault:ClientId"]!,
                                    clientSecret: x.Configuration["AdmGroup:AzureKeyVault:ClientSecret"]!
                                    ))).SingleInstance();
            }
        );
    }
}

