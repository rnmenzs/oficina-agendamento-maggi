namespace Oficina.DAL.Common;

internal static class Datas
{
    // O Npgsql devolve timestamptz como DateTime em UTC, não como DateTimeOffset.
    // A conversão fica aqui, na fronteira com o banco, e o domínio só vê DateTimeOffset.
    public static DateTimeOffset EmUtc(DateTime instante)
    {
        return new DateTimeOffset(DateTime.SpecifyKind(instante, DateTimeKind.Utc), TimeSpan.Zero);
    }
}
