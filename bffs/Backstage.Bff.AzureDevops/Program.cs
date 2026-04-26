using Backstage.Bff.AzureDevops;
using Backstage.Bff.AzureDevops.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();
builder.Configuration.AddEnvironmentVariables();
builder.Services.Configure<AppSettingOptions>(builder.Configuration.GetSection("AdmGroup:AzureDevOps"));

builder.AddAutofac();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

var azureDevOpsGroup = app.MapGroup("api/v1/azure-devops");

azureDevOpsGroup.AddPipelineEndpoints();

app.Run();
