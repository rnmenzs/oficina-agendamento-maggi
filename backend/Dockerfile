# Dois estágios: o SDK compila e publica, e só o runtime vai para a imagem final.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Os .csproj vão antes do resto para o restore ficar em cache enquanto só o código muda.
COPY Oficina.slnx ./
COPY src/Oficina.Domain/Oficina.Domain.csproj src/Oficina.Domain/
COPY src/Oficina.DTO/Oficina.DTO.csproj src/Oficina.DTO/
COPY src/Oficina.BLL/Oficina.BLL.csproj src/Oficina.BLL/
COPY src/Oficina.DAL/Oficina.DAL.csproj src/Oficina.DAL/
COPY src/Oficina.Api/Oficina.Api.csproj src/Oficina.Api/
RUN dotnet restore src/Oficina.Api/Oficina.Api.csproj

COPY src/ src/
RUN dotnet publish src/Oficina.Api/Oficina.Api.csproj -c Release -o /app --no-restore

# Imagem Debian, não Alpine: as regras de horário chamam TimeZoneInfo.FindSystemTimeZoneById, que
# lê o banco de fusos do sistema (tzdata). A Debian traz; a Alpine não, e criar agendamento quebraria.
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

# O Npgsql procura a biblioteca de Kerberos ao iniciar e registra um erro se não a encontra,
# mesmo sem usar Kerberos; a imagem enxuta não a traz. O tzdata a base Debian já tem — vai na
# mesma linha para continuar tendo, mesmo se a base mudar.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgssapi-krb5-2 tzdata \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app .

# A API não precisa de root: a imagem oficial já traz o usuário `app` (APP_UID) e escuta na
# 8080, que não exige privilégio. Depois do apt, que é o único passo que precisava.
USER $APP_UID

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Oficina.Api.dll"]
