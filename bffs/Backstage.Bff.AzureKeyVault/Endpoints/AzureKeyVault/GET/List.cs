using Backstage.Bff.AzureKeyVault.Services;

namespace Backstage.Bff.AzureKeyVault.Endpoints;

internal static partial class AzureKeyVaultEndpoints
{
    public static async Task<IResult> SecretList(IAzureKeyVaultService azureKeyVaultService)
    {
        var secrets = await azureKeyVaultService.SecretListAsync();
        return Results.Ok(secrets);
    }

    public static async Task<IResult> CertificateList(IAzureKeyVaultService azureKeyVaultService)
    {
        var certificates = await azureKeyVaultService.CertificateListAsync();
        return Results.Ok(certificates);
    }
}


