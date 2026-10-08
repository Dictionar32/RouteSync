# Phase 91 — Resource Capability Model

## Tujuan

Naikkan pengetahuan Laravel menjadi data model. Resolver tidak membuat keputusan domain berdasarkan mode resource melalui rangkaian `if`/`switch`.

Laravel 13 mendokumentasikan empat keluarga registrasi resource yang dimodelkan di sini: `resource`, `apiResource`, `singleton`, dan `apiSingleton`. Resource juga memiliki action set dan capability tambahan seperti `creatable()` / `destroyable()`, sedangkan `withTrashed()` mempunyai action default yang bergantung pada resource registration.

## Model

```text
ResourceRegistrationMode
        ↓ identity
ResourceCapabilityProfile
 ├── actions
 ├── capabilities
 ├── creation
 ├── destruction
 └── withTrashedDefaults
```

Catalog:

```text
resource       → profile
api_resource   → profile
singleton      → profile
api_singleton  → profile
```

Resolver hanya melakukan lookup:

```text
Fact
 ↓
ResourceRegistrationMode
 ↓
ResourceCapabilityCatalog
 ↓
ResourceSemanticModel
 ↓
RouteResourceContract
 ↓
dumb flow
```

## Capability

```text
action(index/create/store/show/edit/update/destroy)
creatable_singleton
destroyable_singleton
```

`creatable` dan `destroyable` sengaja tetap capability terpisah. Kehadiran satu tidak mengimplikasikan yang lain.

## Laravel grounding

Official Laravel 13 Controllers documentation defines resource actions, API resource action reduction, singleton resources, `creatable()`, `destroyable()`, and resource middleware scoping. The routing documentation defines nested group merging and binding behavior.

## Invariant

Menambah mode Laravel baru harus menambah datum pada catalog/profile. Downstream flow tidak perlu mengetahui arti mode tersebut.

Tidak boleh ada:

```text
mode → if/switch → Laravel meaning
```

Yang diinginkan:

```text
mode → identity lookup → capability profile
```
