using Azure.Security.KeyVault.Secrets;
using Azure.Security.KeyVault.Certificates;
namespace Backstage.Bff.AzureKeyVault.Services;

public interface IAzureKeyVaultService
{
    Task<Azure.Response<KeyVaultSecret>?> GetSecretAsync(string secretName);
    Task<IList<KeyVaultSecret>> SecretListAsync();
    Task<KeyVaultCertificateWithPolicy> CreateCertificate(string certificateName);
    Task<KeyVaultCertificateWithPolicy> GetCertificate(string certificateName);
    Task<Azure.AsyncPageable<CertificateProperties>> CertificateListAsync();
}

