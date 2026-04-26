using Backstage.Bff.AzureKeyVault.Services;
namespace Backstage.Bff.AzureKeyVault.Endpoints;

internal static partial class AzureKeyVaultEndpoints
{
    public static async Task<IResult> CertificateByName(string certificateName,
        IAzureKeyVaultService azureKeyVaultService)
    {
        var certificate = await azureKeyVaultService.GetCertificate(certificateName);
        return Results.Ok(certificate);
    }
}
