using Backstage.Bff.Kubernetes;
using Backstage.Bff.Kubernetes.Endpoints;
using Microsoft.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();
builder.Configuration.AddEnvironmentVariables();

builder.AddAutofac();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

var k8sGroup = app.MapGroup("api/v1/k8s");
k8sGroup.AddKubernetesEndpoints();

app.Run();

