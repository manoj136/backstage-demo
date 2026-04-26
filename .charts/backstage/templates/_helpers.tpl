{{- define "app.name" -}}
{{- .Chart.Name  }}
{{- end }}


{{- define "app.labels" -}}
helm.sh/chart: {{ .Chart.Name }}
{{ include "app.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}


{{- define "app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "secretProviderClasses.omegaSecrets.customAuth" -}}
usePodIdentity: "false"
useVMManagedIdentity: "true"
tenantId: 8201f92e-8641-4feb-9268-9de6950fdf1c
userAssignedIdentityID: b30515c5-5622-420b-94fc-ae51efc21b4c
{{- end -}}

{{- define "app.host" -}}
{{- if eq .Values.environment "production" -}}
{{- print "backstage.admsolutions.com" -}}
{{- else -}}
{{- print "backstage-development.admsolutions.com" -}}
{{- end }}
{{- end }}