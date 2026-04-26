using Backstage.Bff.AzureKeyVault.Services;
namespace Backstage.Bff.AzureKeyVault.Endpoints;

internal static partial class AzureKeyVaultEndpoints
{
    public static async Task<IResult> CreateCertificate(string certificateName,
        IAzureKeyVaultService azureKeyVaultService)
    {
        var certificate = await azureKeyVaultService.CreateCertificate(certificateName);
        return Results.Ok(certificate);
    }
}
