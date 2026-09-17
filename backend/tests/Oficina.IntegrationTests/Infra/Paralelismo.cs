// A connection string vai pelo ambiente do processo: duas coleções rodando ao mesmo tempo
// disputariam a variável. Hoje há uma coleção; isto garante que continuar assim não dependa de
// ninguém lembrar.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
