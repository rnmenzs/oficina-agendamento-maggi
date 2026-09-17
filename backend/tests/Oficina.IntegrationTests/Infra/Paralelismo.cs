// A connection string vai pelo ambiente do processo e o pool do Npgsql é global: duas coleções
// rodando ao mesmo tempo disputariam os dois. Hoje há uma coleção; isto garante que continuar
// assim não dependa de ninguém lembrar.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
