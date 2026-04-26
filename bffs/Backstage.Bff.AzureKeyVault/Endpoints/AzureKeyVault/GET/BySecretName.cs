using Backstage.Bff.AzureKeyVault.Services;
namespace Backstage.Bff.AzureKeyVault.Endpoints;

internal static partial class AzureKeyVaultEndpoints
{
    public static async Task<IResult> SecretByName(string secretName, 
        IAzureKeyVaultService azureKeyVaultService)
    {
        var secret = await azureKeyVaultService.GetSecretAsync(secretName);
        return Results.Ok(secret);
    }
}

