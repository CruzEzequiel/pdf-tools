# Guía de arquitectura — Apps React

Convenciones y estructura que uso en mis proyectos React. El objetivo es que cualquier app nueva arranque con la misma organización y sea fácil de escalar.

## Stack base

- **React 19** + **TypeScript**
- **Vite** — build tool
- **Tailwind CSS v4** — estilos (solo clases utilitarias, sin CSS propio)
- **React Router DOM v7** — navegación
- **Axios** — cliente HTTP
- **Lucide React** — iconos

---

## Estructura de carpetas

```
src/
├── App.tsx                          # Raíz: monta BrowserRouter, providers y AppRoutes
├── main.tsx                         # Entry point de React
├── index.css                        # Solo: @import "tailwindcss"
│
├── domain/                          # Modelos de negocio puros (sin dependencias)
│   └── entities/
│       ├── db/                      # Tipos que reflejan tablas de la base de datos
│       │   ├── public/
│       │   │   ├── user.ts
│       │   │   └── product.ts
│       │   └── private/
│       │       └── audit.ts
│       └── api/                     # Tipos de respuestas y payloads de APIs externas
│           ├── banxico.ts
│           └── claude.ts
│
├── application/                     # Lógica de aplicación: contextos y estado global
│   └── context/
│       └── authContext/
│           ├── AuthContext.ts
│           ├── AuthProvider.tsx
│           └── useAuth.ts
│
├── infrastructure/                  # Integraciones externas
│   ├── api/                         # Un archivo por API externa
│   │   ├── banxico.ts
│   │   ├── claude.ts
│   │   ├── handleApiError.ts        # Manejo centralizado de errores HTTP
│   │   └── apiRoutes.ts             # Constantes de rutas (opcional)
│   ├── data/                        # Acceso a datos organizado por esquema de DB
│   │   ├── public/
│   │   │   ├── user.ts
│   │   │   └── product.ts
│   │   └── private/
│   │       └── audit.ts
│   ├── services/                    # Clientes singleton de servicios externos
│   │   └── supabase.ts
│   └── useCases/                    # Use cases de infraestructura (funciones async puras)
│       └── generateToken.ts
│
└── presentation/                    # Todo lo visual
    ├── Layout/
    │   ├── mainLayout.tsx
    │   └── components/
    │       ├── topbar/
    │       └── aside/
    ├── routes/
    │   ├── routes.tsx
    │   └── middlewares/
    │       └── secureRoute.tsx
    ├── components/                  # Componentes reutilizables entre páginas
    │   ├── modals/                  # Modales compartidos
    │   └── useCases/                # Custom hooks compartidos entre páginas
    └── pages/
        ├── public/
        │   └── login/
        │       ├── Login.tsx
        │       └── view/
        │           ├── loginView.tsx
        │           └── components/
        └── user/
            └── dashboard/
                ├── Dashboard.tsx
                └── view/
                    ├── dashboardView.tsx
                    └── components/
```

---

## Capas de la arquitectura

### `domain/`
Tipos TypeScript puros de las entidades del negocio. No importa nada del proyecto, solo define la forma de los datos.

```ts
// domain/entities/databaseModels.ts
export interface User { id: string; email: string; role: 'admin' | 'user' }
export interface Product { id: string; name: string; status: string }
```

### `application/`
Contextos globales de React. Cada contexto vive en su propia carpeta con tres archivos fijos. Ver sección [Contextos](#contextos) para ejemplos completos.

### `infrastructure/`
Todo lo que toca el mundo exterior: HTTP, base de datos, autenticación.

- `api/` — un archivo por API externa (`banxico.ts`, `claude.ts`). Cada archivo exporta las funciones de esa API y maneja su autenticación particular. `handleApiError.ts` centraliza el manejo de errores HTTP.
- `data/` — funciones async de acceso a datos, organizadas por esquema de base de datos (`public/`, `private/`, etc.). Cada archivo agrupa las operaciones de una tabla o entidad.
- `services/` — clientes singleton de servicios externos (Supabase, Firebase)
- `useCases/` — funciones async puras con lógica de negocio que orquestan llamadas a `data/` y `api/`

### `presentation/`
Todo lo visual. No habla directamente con APIs — consume `infrastructure/data/` o use cases.

---

## Cómo se arma una página

Patrón fijo: **Page → View → Components**

```
pages/user/dashboard/
├── Dashboard.tsx              # Page: layout + view, sin lógica
└── view/
    ├── dashboardView.tsx      # View: estado, efectos, composición
    └── components/            # Componentes exclusivos de esta página
        ├── StatsCard.tsx
        └── types.ts           # Tipos locales si la página los necesita
```

### Page

Sin lógica. Solo envuelve con el layout y monta la view.

```tsx
import PageLayout from '../../../Layout/mainLayout'
import DashboardView from './view/dashboardView'

export default function Dashboard() {
  return (
    <PageLayout>
      <DashboardView />
    </PageLayout>
  )
}
```

### View

Estado local, efectos y composición de componentes. Es el "cerebro" de la página.

```tsx
export default function DashboardView() {
  const [data, setData] = useState<Product[]>([])

  useEffect(() => { /* carga inicial */ }, [])
  useEffect(() => { /* reacción a cambios */ }, [data])

  return (
    <div>
      <StatsCard data={data} />
    </div>
  )
}
```

Si la lógica crece, se extrae a un use case (custom hook) en `view/useCases/` o en `presentation/components/useCases/` si es compartido.

### Components

Componentes acotados a esa página. Si se necesitan en otra página se mueven a `presentation/components/`.

---

## Use Cases

Use cases encapsulan lógica reutilizable. Existen en dos niveles:

### Use case de infraestructura (función async pura)

Para lógica que orquesta llamadas a datos sin estado React.

```ts
// infrastructure/useCases/generateToken.ts
export async function generateMagicToken(
  email: string,
  token: string
): Promise<{ success: boolean; token?: string }> {
  // orquesta llamadas a data/
}
```

### Use case de presentación (custom hook)

Para lógica con estado React reutilizable entre páginas o componentes.

```ts
// presentation/components/useCases/useBusinessProducts.ts
export function useBusinessProducts(initialParams = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { /* fetch */ }, [])

  return { products, loading }
}
```

**Dónde viven:**

| Ubicación | Cuándo usarla |
|-----------|--------------|
| `infrastructure/useCases/` | Función async pura, sin estado React |
| `presentation/components/useCases/` | Hook compartido entre múltiples páginas |
| `presentation/pages/.../view/useCases/` | Hook exclusivo de una página |

---

## Modales

Los modales compartidos viven en `presentation/components/modals/`. Se invocan con estado local desde el componente que los usa.

```tsx
// presentation/components/modals/confirmationModal.tsx
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  intent?: 'default' | 'destructive'
  confirmLabel?: string
  cancelLabel?: string
}

export default function ConfirmationModal({ isOpen, onClose, onConfirm, ...props }: ConfirmModalProps) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 ...">
      {/* contenido */}
    </div>
  )
}
```

Invocación desde cualquier componente:

```tsx
const [showConfirm, setShowConfirm] = useState(false)

<ConfirmationModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Eliminar archivo"
  message="Esta acción no se puede deshacer."
  intent="destructive"
/>
```

Tipos de modales comunes:
- `confirmationModal` — acción genérica con intención (default / destructive)
- `deleteConfirmationModal` — confirmación de eliminación
- `notificationModal` — mensajes informativos
- `previewModal` — vista previa de archivos
- `processModal` — loader con progreso de operación larga

---

## Contextos

Cada contexto se divide en tres archivos dentro de su propia carpeta:

```
application/context/authContext/
├── AuthContext.ts       # createContext + tipos
├── AuthProvider.tsx     # lógica + Provider
└── useAuth.ts           # hook con guard de contexto
```

### AuthContext.ts

Define los tipos y crea el contexto. No tiene lógica.

```ts
import { createContext } from 'react'
import type { User } from '../../domain/entities/db/public/user'

export interface AuthContextType {
  isLoggedIn: boolean
  isLogging: boolean
  user: User | null
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
```

### AuthProvider.tsx

Contiene toda la lógica: carga de sesión, efectos, persistencia. Puede usar `sessionStorage` para sobrevivir recargas.

```tsx
import { useState, useEffect } from 'react'
import { AuthContext } from './AuthContext'
import type { User } from '../../domain/entities/db/public/user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [isLogging, setIsLogging] = useState(true)

  useEffect(() => {
    // verificar sesión al montar (ej: supabase.auth.getSession)
    setIsLogging(false)
  }, [])

  useEffect(() => {
    if (user) sessionStorage.setItem('user', JSON.stringify(user))
    else sessionStorage.removeItem('user')
  }, [user])

  const logout = async () => {
    setUser(null)
    // ej: await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, isLogging, user, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### useAuth.ts

Hook con guard: lanza error si se usa fuera del provider.

```ts
import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
```

---

## Rutas

Todas las rutas en un solo archivo.

```tsx
// routes/routes.tsx
const AppRoutes = () => (
  <Routes>
    <Route path="/"          element={<Login />} />
    <Route path="/login"     element={<Login />} />
    <Route path="/dashboard" element={<SecureRoute><Dashboard /></SecureRoute>} />
    <Route path="/profile"   element={<SecureRoute><Profile /></SecureRoute>} />
  </Routes>
)
```

### SecureRoute

```tsx
const SecureRoute = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn, isLogging } = useAuth()
  if (isLogging) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

---

## App.tsx

Solo monta el router y los providers. Sin lógica.

```tsx
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}
```

---

## Agregar una nueva página — checklist

1. Crear carpeta `pages/<dominio>/<nombre>/`
2. Crear `<Nombre>.tsx` — solo `PageLayout` + View
3. Crear `view/<nombre>View.tsx` — estado y composición
4. Crear `view/components/` para componentes propios
5. Si la lógica es compleja, extraerla a `view/useCases/use<Nombre>.ts`
6. Registrar la ruta en `routes/routes.tsx`
7. Si la ruta es privada, envolverla en `<SecureRoute>`

---

## Convenciones de nombres

| Qué | Convención | Ejemplo |
|-----|-----------|---------|
| Componentes y Pages | `PascalCase.tsx` | `Dashboard.tsx` |
| Vistas | `camelCase` + `View.tsx` | `dashboardView.tsx` |
| Custom hooks / use cases | `use` + `PascalCase.ts` | `useBusinessProducts.ts` |
| Use cases async puros | `camelCase` + verbo | `generateToken.ts` |
| Data layer | `data` + `PascalCase.ts` | `dataAdmin.ts` |
| Carpetas de página | `camelCase/` | `dashboard/` |
| Tipos locales de una página | `types.ts` dentro de `components/` | — |
| Estilos | Solo clases Tailwind | sin archivos `.css` propios |
