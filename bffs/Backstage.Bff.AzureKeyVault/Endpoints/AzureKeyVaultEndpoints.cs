namespace Backstage.Bff.AzureKeyVault.Endpoints;

internal static partial class AzureKeyVaultEndpoints
{
    public static void AddAzureKeyVaultEndpoints(this RouteGroupBuilder x)
    {
       x.MapGet("secrets/{secretName}", SecretByName);
       x.MapGet("secrets", SecretList);
       //x.MapGet("certificates", CertificateList);
       //x.MapGet("certificates/{certificateName}", CertificateByName);
       //x.MapPost("certificates", CreateCertificate);
    }
}
