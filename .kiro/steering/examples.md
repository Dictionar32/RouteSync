# RouteSync: Contoh-contoh Penggunaan Praktis

## Filosofi Examples

RouteSync dirancang untuk **real-world use cases**. Examples ini menunjukkan implementasi praktis mulai dari basic CRUD sampai advanced scenarios seperti authentication, file upload, dan complex relationships.

## Basic Examples

### 1. Simple CRUD API

**Backend Laravel:**
```php
// routes/api.php
Route::apiResource('users', UserController::class);

// app/Http/Controllers/UserController.php
class UserController extends Controller
{
    #[Response(model: User::class)]
    public function index(): JsonResponse
    {
        return UserResource::collection(User::paginate());
    }
    
    #[Response(model: User::class)]
    public function show(User $user): JsonResponse
    {
        return new UserResource($user);
    }
    
    #[Response(model: User::class)]
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create($request->validated());
        return new UserResource($user);
    }
}

// app/Http/Requests/StoreUserRequest.php
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
            'password' => ['required', 'min:8', 'confirmed']
        ];
    }
}
```

**Generate SDK:**
```bash
# Scan Laravel routes
npx routesync scan --input routes/api.php --models --output routesync.manifest.json

# Generate complete SDK
npx routesync generate --manifest routesync.manifest.json --output src/api --zod --next-actions
```
**Frontend Usage (React):**
```tsx
import { useUsers, useUsersCreate } from '@/api'
import { UserCreateSchema } from '@/api/schemas'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// List users dengan pagination
function UsersList() {
  const { users, isLoading, error } = useUsers()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <ul>
      {users?.data.map(user => (
        <li key={user.id}>{user.name} - {user.email}</li>
      ))}
    </ul>
  )
}

// Create user form dengan validation
function CreateUserForm() {
  const createUser = useUsersCreate()
  const form = useForm({
    resolver: zodResolver(UserCreateSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: ''
    }
  })
  
  const onSubmit = (data) => {
    createUser.mutate(data, {
      onSuccess: () => {
        form.reset()
        // Success toast otomatis tampil
      }
    })
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} placeholder="Name" />
      {form.formState.errors.name && <p>{form.formState.errors.name.message}</p>}
      
      <input {...form.register('email')} placeholder="Email" />
      {form.formState.errors.email && <p>{form.formState.errors.email.message}</p>}
      
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}
```

### 2. Authentication Flow

**Backend Laravel:**
```php
// routes/api.php
Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/register', [AuthController::class, 'register']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
});

// app/Http/Controllers/AuthController.php
class AuthController extends Controller
{
    #[Response(model: AuthTokenResponse::class)]
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();
        
        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials']
            ]);
        }
        
        $user = Auth::user();
        $token = $user->createToken('api-token')->plainTextToken;
        
        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
            'expires_in' => config('sanctum.expiration')
        ]);
    }
}
```
**Frontend Usage (React):**
```tsx
import { useAuthLogin, useAuthMe } from '@/api'
import { createClient } from 'routesync'

// Setup authenticated client
const client = createClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  toast: {
    success: (msg) => toast.success(msg),
    error: (msg) => toast.error(msg)
  }
})

// Login component
function LoginForm() {
  const login = useAuthLogin()
  
  const handleLogin = (credentials) => {
    login.mutate(credentials, {
      onSuccess: (response) => {
        // Set token untuk authenticated requests
        client.setToken(response.token)
        
        // Redirect ke dashboard
        router.push('/dashboard')
      }
    })
  }
  
  return (
    <form onSubmit={handleSubmit(handleLogin)}>
      {/* Form fields */}
    </form>
  )
}

// Protected route component
function Dashboard() {
  const { user, isLoading } = useAuthMe() // Auto-authenticated call
  
  if (isLoading) return <div>Loading profile...</div>
  
  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      {/* Dashboard content */}
    </div>
  )
}
```

## Advanced Examples

### 3. File Upload dengan Progress

**Backend Laravel:**
```php
// routes/api.php
Route::post('files/upload', [FileController::class, 'upload'])->middleware('auth:sanctum');

// app/Http/Controllers/FileController.php
class FileController extends Controller
{
    #[Response(model: UploadedFile::class)]
    public function upload(UploadFileRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $path = $file->store('uploads', 'public');
        
        $uploadedFile = UploadedFile::create([
            'filename' => $file->getClientOriginalName(),
            'path' => $path,
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'user_id' => auth()->id()
        ]);
        
        return new UploadedFileResource($uploadedFile);
    }
}

// app/Http/Requests/UploadFileRequest.php
class UploadFileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:10240'], // 10MB max
            'description' => ['nullable', 'string', 'max:500']
        ];
    }
}
```
**Frontend Usage (React):**
```tsx
import { useFilesUpload } from '@/api'
import { useState } from 'react'

function FileUploader() {
  const [progress, setProgress] = useState(0)
  const upload = useFilesUpload()
  
  const handleFileUpload = (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('description', 'User uploaded file')
    
    upload.mutate(formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        setProgress(percentCompleted)
      },
      onSuccess: (response) => {
        setProgress(0)
        console.log('File uploaded:', response.filename)
      }
    })
  }
  
  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
      />
      
      {upload.isPending && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  )
}
```

### 4. Complex Relationships & Filtering

**Backend Laravel:**
```php
// app/Models/Post.php
class Post extends Model
{
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }
    
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}

// routes/api.php
Route::get('posts', [PostController::class, 'index']);
Route::get('posts/{post}', [PostController::class, 'show']);

// app/Http/Controllers/PostController.php
class PostController extends Controller
{
    #[Response(model: Post::class, collection: true)]
    public function index(FilterPostsRequest $request): JsonResponse
    {
        $query = Post::with(['author', 'categories'])
            ->withCount('comments');
            
        // Apply filters
        if ($request->category) {
            $query->whereHas('categories', fn($q) => $q->where('slug', $request->category));
        }
        
        if ($request->author) {
            $query->whereHas('author', fn($q) => $q->where('username', $request->author));
        }
        
        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }
        
        return PostResource::collection(
            $query->paginate($request->per_page ?? 15)
        );
    }
}
```
**Frontend Usage (React):**
```tsx
import { usePosts } from '@/api'
import { useState } from 'react'

function PostsPage() {
  const [filters, setFilters] = useState({
    category: '',
    author: '',
    search: '',
    per_page: 15
  })
  
  // Auto-refetch saat filters berubah
  const { posts, isLoading, error } = usePosts({ 
    query: filters,
    enabled: true // Always enabled, will refetch on filter changes
  })
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }
  
  return (
    <div>
      {/* Filter controls */}
      <div className="filters">
        <input
          placeholder="Search posts..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        
        <select 
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="tech">Technology</option>
          <option value="design">Design</option>
        </select>
        
        <input
          placeholder="Author username"
          value={filters.author}
          onChange={(e) => handleFilterChange('author', e.target.value)}
        />
      </div>
      
      {/* Posts list */}
      {isLoading && <div>Loading posts...</div>}
      
      {error && <div>Error: {error.message}</div>}
      
      {posts?.data && (
        <div className="posts-grid">
          {posts.data.map(post => (
            <PostCard 
              key={post.id} 
              post={post}
              author={post.author} 
              categories={post.categories}
              commentsCount={post.comments_count}
            />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {posts?.meta && <Pagination meta={posts.meta} />}
    </div>
  )
}
```

## E-commerce Examples

### 5. Shopping Cart Implementation

**Backend Laravel:**
```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('cart', [CartController::class, 'show']);
    Route::post('cart/items', [CartController::class, 'addItem']);
    Route::put('cart/items/{item}', [CartController::class, 'updateItem']);
    Route::delete('cart/items/{item}', [CartController::class, 'removeItem']);
    Route::post('cart/apply-coupon', [CartController::class, 'applyCoupon']);
    Route::delete('cart/remove-coupon', [CartController::class, 'removeCoupon']);
});

// app/Http/Controllers/CartController.php
class CartController extends Controller
{
    #[Response(model: Cart::class)]
    public function show(): JsonResponse
    {
        $cart = auth()->user()->cart()->with(['items.product'])->first();
        return new CartResource($cart);
    }
    
    #[Response(model: CartItem::class)]
    public function addItem(AddCartItemRequest $request): JsonResponse
    {
        $cart = auth()->user()->cart()->firstOrCreate();
        
        $existingItem = $cart->items()
            ->where('product_id', $request->product_id)
            ->first();
            
        if ($existingItem) {
            $existingItem->increment('quantity', $request->quantity);
            $item = $existingItem;
        } else {
            $item = $cart->items()->create($request->validated());
        }
        
        return new CartItemResource($item->load('product'));
    }
}
```
**Frontend Usage (React):**
```tsx
import { useCart, useCartAddItem, useCartUpdateItem } from '@/api'

function ShoppingCart() {
  const { cart, isLoading } = useCart()
  const addItem = useCartAddItem()
  const updateItem = useCartUpdateItem()
  
  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0
      removeItem.mutate(item.id)
    } else {
      updateItem.mutate({
        item: item.id,
        body: { quantity: newQuantity }
      })
    }
  }
  
  if (isLoading) return <div>Loading cart...</div>
  
  return (
    <div className="cart">
      <h2>Shopping Cart ({cart?.items_count} items)</h2>
      
      {cart?.items?.map(item => (
        <div key={item.id} className="cart-item">
          <img src={item.product.image} alt={item.product.name} />
          
          <div className="item-details">
            <h3>{item.product.name}</h3>
            <p>${item.product.price}</p>
          </div>
          
          <div className="quantity-controls">
            <button 
              onClick={() => handleQuantityChange(item, item.quantity - 1)}
            >
              -
            </button>
            <span>{item.quantity}</span>
            <button 
              onClick={() => handleQuantityChange(item, item.quantity + 1)}
            >
              +
            </button>
          </div>
          
          <div className="item-total">
            ${(item.quantity * item.product.price).toFixed(2)}
          </div>
        </div>
      ))}
      
      <div className="cart-summary">
        <div>Subtotal: ${cart?.subtotal}</div>
        {cart?.discount && <div>Discount: -${cart.discount}</div>}
        <div>Tax: ${cart?.tax}</div>
        <div className="total">Total: ${cart?.total}</div>
      </div>
    </div>
  )
}

// Domain-specific helper methods (auto-generated oleh RouteSync)
function ProductCard({ product }: { product: Product }) {
  const { inc } = useCart() // Helper method dari RouteSync
  
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={() => inc(product.id)}>
        Add to Cart
      </button>
    </div>
  )
}
```

### 6. Real-time Notifications

**Backend Laravel:**
```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::put('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::put('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});

// app/Http/Controllers/NotificationController.php
class NotificationController extends Controller
{
    #[Response(model: Notification::class, collection: true)]
    public function index(): JsonResponse
    {
        $notifications = auth()->user()
            ->notifications()
            ->latest()
            ->paginate(20);
            
        return NotificationResource::collection($notifications);
    }
    
    #[Response(model: Notification::class)]
    public function markAsRead(DatabaseNotification $notification): JsonResponse
    {
        $notification->markAsRead();
        return new NotificationResource($notification);
    }
}

// Broadcasting setup
// app/Events/OrderStatusChanged.php
class OrderStatusChanged implements ShouldBroadcast
{
    public function __construct(public Order $order) {}
    
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->order->user_id}")
        ];
    }
}
```
**Frontend Usage (React dengan WebSocket):**
```tsx
import { useNotifications, useNotificationsMarkAllAsRead } from '@/api'
import { useEffect, useState } from 'react'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Setup Laravel Echo
const echo = new Echo({
  broadcaster: 'pusher',
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
  forceTLS: true,
  authorizer: (channel: any) => ({
    authorize: (socketId: string, callback: Function) => {
      fetch('/api/broadcasting/auth', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          socket_id: socketId,
          channel_name: channel.name
        })
      })
      .then(response => response.json())
      .then(data => callback(null, data))
      .catch(error => callback(error))
    }
  })
})

function NotificationCenter() {
  const { notifications, refetch } = useNotifications()
  const markAllAsRead = useNotificationsMarkAllAsRead()
  const [unreadCount, setUnreadCount] = useState(0)
  
  useEffect(() => {
    // Listen for real-time notifications
    const channel = echo.private(`user.${userId}`)
    
    channel.listen('OrderStatusChanged', (e: any) => {
      // Refetch notifications untuk get latest data
      refetch()
      
      // Show toast notification
      toast.info(`Order #${e.order.id} status changed to ${e.order.status}`)
    })
    
    return () => {
      echo.leave(`user.${userId}`)
    }
  }, [userId, refetch])
  
  useEffect(() => {
    // Update unread count
    const unread = notifications?.data?.filter(n => !n.read_at).length || 0
    setUnreadCount(unread)
  }, [notifications])
  
  return (
    <div className="notification-center">
      <div className="notification-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
        <button onClick={() => markAllAsRead.mutate()}>
          Mark All Read
        </button>
      </div>
      
      <div className="notifications-list">
        {notifications?.data?.map(notification => (
          <NotificationItem 
            key={notification.id}
            notification={notification}
          />
        ))}
      </div>
    </div>
  )
}

function NotificationItem({ notification }: { notification: Notification }) {
  const markAsRead = useNotificationsMarkAsRead()
  
  const handleClick = () => {
    if (!notification.read_at) {
      markAsRead.mutate({ notification: notification.id })
    }
  }
  
  return (
    <div 
      className={`notification-item ${!notification.read_at ? 'unread' : ''}`}
      onClick={handleClick}
    >
      <div className="notification-icon">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="notification-content">
        <h4>{notification.data.title}</h4>
        <p>{notification.data.message}</p>
        <span className="notification-time">
          {formatTimeAgo(notification.created_at)}
        </span>
      </div>
    </div>
  )
}
```

## Next.js Server Actions Examples

### 7. Server-Side Data Mutations

**Generate Server Actions:**
```bash
npx routesync generate --manifest routesync.manifest.json --output src/api --next-actions
```
**Generated Server Actions Usage:**
```tsx
// app/users/page.tsx (Server Component)
import { usersGetAction } from '@/api/actions'
import { CreateUserForm } from './create-user-form'

export default async function UsersPage() {
  // Server-side data fetching
  const usersResponse = await usersGetAction({
    query: { per_page: 10 }
  })
  
  return (
    <div>
      <h1>Users Management</h1>
      
      <CreateUserForm />
      
      <div className="users-grid">
        {usersResponse.data.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  )
}

// app/users/create-user-form.tsx (Client Component)
'use client'

import { usersPostAction } from '@/api/actions'
import { UserCreateSchema } from '@/api/schemas'
import { useActionState } from 'react'

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    async (prevState: any, formData: FormData) => {
      try {
        const data = {
          name: formData.get('name') as string,
          email: formData.get('email') as string,
          password: formData.get('password') as string,
          password_confirmation: formData.get('password_confirmation') as string
        }
        
        // Validate dengan Zod schema
        const validated = UserCreateSchema.parse(data)
        
        // Call server action
        const result = await usersPostAction({ body: validated })
        
        return { success: true, user: result }
      } catch (error) {
        return { 
          success: false, 
          errors: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    },
    { success: false, errors: null }
  )
  
  return (
    <form action={formAction} className="create-user-form">
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <input name="password_confirmation" type="password" placeholder="Confirm Password" required />
      
      <button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create User'}
      </button>
      
      {state.success && <p className="success">User created successfully!</p>}
      {state.errors && <p className="error">{state.errors}</p>}
    </form>
  )
}
```

## Vue.js Examples

### 8. Vue Composition API dengan TanStack Query

**Frontend Usage (Vue 3):**
```vue
<!-- UsersList.vue -->
<template>
  <div class="users-page">
    <h1>Users Management</h1>
    
    <CreateUserForm @user-created="refetchUsers" />
    
    <div v-if="isLoading" class="loading">
      Loading users...
    </div>
    
    <div v-else-if="error" class="error">
      Error: {{ error.message }}
    </div>
    
    <div v-else class="users-grid">
      <UserCard 
        v-for="user in users?.data" 
        :key="user.id"
        :user="user"
        @user-updated="refetchUsers"
      />
    </div>
    
    <Pagination 
      v-if="users?.meta"
      :meta="users.meta"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUsers } from '@/api'
import CreateUserForm from './CreateUserForm.vue'
import UserCard from './UserCard.vue'
import Pagination from './Pagination.vue'

const page = ref(1)
const perPage = ref(15)

const { 
  data: users, 
  isLoading, 
  error, 
  refetch: refetchUsers 
} = useUsers({
  query: {
    page: page.value,
    per_page: perPage.value
  }
})

const handlePageChange = (newPage: number) => {
  page.value = newPage
}
</script>
```
```vue
<!-- CreateUserForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="create-user-form">
    <div class="form-group">
      <label for="name">Name</label>
      <Field 
        id="name"
        name="name" 
        v-model="form.name"
        :class="{ error: errors.name }"
      />
      <ErrorMessage name="name" class="error-message" />
    </div>
    
    <div class="form-group">
      <label for="email">Email</label>
      <Field 
        id="email"
        name="email" 
        type="email"
        v-model="form.email"
        :class="{ error: errors.email }"
      />
      <ErrorMessage name="email" class="error-message" />
    </div>
    
    <div class="form-group">
      <label for="password">Password</label>
      <Field 
        id="password"
        name="password" 
        type="password"
        v-model="form.password"
        :class="{ error: errors.password }"
      />
      <ErrorMessage name="password" class="error-message" />
    </div>
    
    <button type="submit" :disabled="createUser.isPending.value">
      {{ createUser.isPending.value ? 'Creating...' : 'Create User' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Field, ErrorMessage, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useUsersCreate } from '@/api'
import { UserCreateSchema } from '@/api/schemas'

const emit = defineEmits<{
  userCreated: [user: User]
}>()

const createUser = useUsersCreate()

const { handleSubmit, errors, resetForm } = useForm({
  validationSchema: toTypedSchema(UserCreateSchema),
  initialValues: {
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  }
})

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const onSubmit = handleSubmit((values) => {
  createUser.mutate(values, {
    onSuccess: (newUser) => {
      resetForm()
      emit('userCreated', newUser)
      
      // Success notification otomatis dari RouteSync client
    }
  })
})
</script>
```

## Testing Examples

### 9. Testing Generated SDK

**Unit Tests:**
```typescript
// __tests__/api/users.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUsers, useUsersCreate } from '@/api'
import { createClient } from 'routesync'

// Mock API client
const mockClient = createClient({
  baseURL: 'http://localhost:8000/api',
  fetch: jest.fn() // Mock fetch untuk testing
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

describe('Users API Hooks', () => {
  beforeEach(() => {
    queryClient.clear()
  })
  
  it('should fetch users successfully', async () => {
    const mockUsers = {
      data: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ],
      meta: { current_page: 1, total: 2 }
    }
    
    ;(mockClient.fetch as jest.Mock).mockResolvedValue(mockUsers)
    
    const { result } = renderHook(() => useUsers(), { wrapper })
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.users?.data).toHaveLength(2)
    expect(result.current.users?.data[0].name).toBe('John Doe')
  })
  
  it('should create user successfully', async () => {
    const newUserData = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      password_confirmation: 'password123'
    }
    
    const createdUser = {
      id: 3,
      name: 'New User',
      email: 'newuser@example.com'
    }
    
    ;(mockClient.fetch as jest.Mock).mockResolvedValue(createdUser)
    
    const { result } = renderHook(() => useUsersCreate(), { wrapper })
    
    result.current.mutate(newUserData)
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data?.name).toBe('New User')
  })
})
```
**Integration Tests:**
```typescript
// __tests__/integration/e2e-cart.test.ts
import { setupTestEnvironment, teardownTestEnvironment } from './test-utils'
import { useCart, useProducts } from '@/api'
import { renderHook, act } from '@testing-library/react'

describe('E2E Cart Integration', () => {
  beforeAll(async () => {
    await setupTestEnvironment() // Setup test database, seed data
  })
  
  afterAll(async () => {
    await teardownTestEnvironment()
  })
  
  it('should complete full shopping flow', async () => {
    // 1. Get available products
    const { result: productsResult } = renderHook(() => useProducts())
    await waitFor(() => expect(productsResult.current.isSuccess).toBe(true))
    
    const product = productsResult.current.products?.data[0]
    expect(product).toBeDefined()
    
    // 2. Add to cart
    const { result: cartResult } = renderHook(() => useCart())
    
    act(() => {
      cartResult.current.inc(product!.id)
    })
    
    await waitFor(() => {
      expect(cartResult.current.cart?.items_count).toBe(1)
    })
    
    // 3. Update quantity
    act(() => {
      cartResult.current.inc(product!.id) // Add one more
    })
    
    await waitFor(() => {
      const item = cartResult.current.cart?.items?.find(i => i.product_id === product!.id)
      expect(item?.quantity).toBe(2)
    })
    
    // 4. Apply coupon
    act(() => {
      cartResult.current.applyPromo('SAVE10')
    })
    
    await waitFor(() => {
      expect(cartResult.current.cart?.discount).toBeGreaterThan(0)
    })
    
    // 5. Remove item
    act(() => {
      cartResult.current.remove(product!.id)
    })
    
    await waitFor(() => {
      expect(cartResult.current.cart?.items_count).toBe(0)
    })
  })
})
```

## MSW (Mock Service Worker) Integration

### 10. API Mocking untuk Development/Testing

**Generate MSW Handlers:**
```bash
npx routesync generate --manifest routesync.manifest.json --output src/api --msw
```

**Generated MSW Handlers:**
```typescript
// src/api/mocks/handlers.ts (auto-generated)
import { rest } from 'msw'
import { faker } from '@faker-js/faker'

export const handlers = [
  // Users endpoints
  rest.get('/api/users', (req, res, ctx) => {
    const page = req.url.searchParams.get('page') || '1'
    const perPage = req.url.searchParams.get('per_page') || '15'
    
    return res(
      ctx.json({
        data: Array.from({ length: parseInt(perPage) }, () => ({
          id: faker.number.int({ min: 1, max: 1000 }),
          name: faker.person.fullName(),
          email: faker.internet.email(),
          created_at: faker.date.recent().toISOString(),
          updated_at: faker.date.recent().toISOString()
        })),
        meta: {
          current_page: parseInt(page),
          per_page: parseInt(perPage),
          total: faker.number.int({ min: 100, max: 500 })
        }
      })
    )
  }),
  
  rest.post('/api/users', (req, res, ctx) => {
    return res(
      ctx.json({
        id: faker.number.int({ min: 1001, max: 2000 }),
        ...req.body as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    )
  }),
  
  // Cart endpoints
  rest.get('/api/cart', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 1,
        user_id: 1,
        items: [
          {
            id: 1,
            product_id: 101,
            quantity: 2,
            product: {
              id: 101,
              name: 'Sample Product',
              price: 99.99,
              image: faker.image.url()
            }
          }
        ],
        items_count: 1,
        subtotal: 199.98,
        tax: 20.00,
        total: 219.98
      })
    )
  }),
  
  rest.post('/api/cart/items', (req, res, ctx) => {
    const body = req.body as { product_id: number; quantity: number }
    
    return res(
      ctx.json({
        id: faker.number.int({ min: 100, max: 999 }),
        product_id: body.product_id,
        quantity: body.quantity,
        product: {
          id: body.product_id,
          name: faker.commerce.productName(),
          price: parseFloat(faker.commerce.price())
        }
      })
    )
  })
]
```
**Setup MSW dalam Development:**
```typescript
// src/mocks/browser.ts
import { setupWorker } from 'msw'
import { handlers } from '@/api/mocks/handlers'

export const worker = setupWorker(...handlers)

// src/app/page.tsx (Next.js)
if (process.env.NODE_ENV === 'development') {
  import('../mocks/browser').then(({ worker }) => {
    worker.start()
  })
}
```

**MSW untuk Testing:**
```typescript
// __tests__/setup.ts
import { setupServer } from 'msw/node'
import { handlers } from '@/api/mocks/handlers'

export const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Best Practices Examples

### 11. Error Boundary & Error Handling

**Error Boundary untuk Generated Hooks:**
```tsx
// components/ErrorBoundary.tsx
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { QueryErrorResetBoundary } from '@tanstack/react-query'

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="error-fallback">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

export function APIErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ReactErrorBoundary 
          FallbackComponent={ErrorFallback}
          onReset={reset}
        >
          {children}
        </ReactErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

// Usage
function App() {
  return (
    <APIErrorBoundary>
      <UsersList />
      <CreateUserForm />
    </APIErrorBoundary>
  )
}
```

### 12. Loading States & Skeleton UI

**Smart Loading States:**
```tsx
// components/LoadingStates.tsx
import { useUsers } from '@/api'

function UsersListWithLoading() {
  const { users, isLoading, isFetching, error } = useUsers()
  
  if (error) {
    return <ErrorMessage error={error} />
  }
  
  // Initial loading
  if (isLoading) {
    return <UsersSkeleton />
  }
  
  return (
    <div>
      {/* Background refetch indicator */}
      {isFetching && <RefetchingIndicator />}
      
      <div className="users-grid">
        {users?.data?.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  )
}

function UsersSkeleton() {
  return (
    <div className="users-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="user-card skeleton">
          <div className="skeleton-avatar" />
          <div className="skeleton-text skeleton-name" />
          <div className="skeleton-text skeleton-email" />
        </div>
      ))}
    </div>
  )
}
```

### 13. Optimistic Updates

**Optimistic Cart Updates:**
```tsx
// hooks/useOptimisticCart.ts
import { useCart, useCartAddItem, useCartUpdateItem } from '@/api'
import { useQueryClient } from '@tanstack/react-query'

export function useOptimisticCart() {
  const queryClient = useQueryClient()
  const { cart } = useCart()
  const addItemMutation = useCartAddItem()
  const updateItemMutation = useCartUpdateItem()
  
  const optimisticAdd = (productId: number, quantity: number = 1) => {
    // Optimistically update cache
    queryClient.setQueryData(['cart'], (old: any) => {
      const existingItem = old?.items?.find((item: any) => item.product_id === productId)
      
      if (existingItem) {
        return {
          ...old,
          items: old.items.map((item: any) =>
            item.product_id === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
          items_count: old.items_count + quantity
        }
      } else {
        return {
          ...old,
          items: [
            ...old.items,
            {
              id: `temp-${Date.now()}`,
              product_id: productId,
              quantity,
              product: { id: productId, name: 'Loading...', price: 0 }
            }
          ],
          items_count: old.items_count + 1
        }
      }
    })
    
    // Perform actual mutation
    return addItemMutation.mutate(
      { product_id: productId, quantity },
      {
        onError: (error) => {
          // Revert optimistic update on error
          queryClient.invalidateQueries(['cart'])
        }
      }
    )
  }
  
  return {
    cart,
    addItem: optimisticAdd,
    isOptimisticallyUpdating: addItemMutation.isPending
  }
}
```

## Performance Optimization Examples

### 14. React Query Optimization

**Smart Caching & Prefetching:**
```tsx
// hooks/useOptimizedUsers.ts
import { useUsers, useUsersShow } from '@/api'
import { useQueryClient } from '@tanstack/react-query'
import { useInfiniteQuery } from '@tanstack/react-query'

export function useUsersWithPrefetch() {
  const queryClient = useQueryClient()
  
  const { users, ...rest } = useUsers({
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  })
  
  // Prefetch user details on hover
  const prefetchUser = (userId: number) => {
    queryClient.prefetchQuery({
      queryKey: ['users', userId],
      queryFn: () => useUsersShow.queryFn({ params: { id: userId } }),
      staleTime: 5 * 60 * 1000
    })
  }
  
  return {
    users,
    prefetchUser,
    ...rest
  }
}

// Infinite scroll implementation
export function useInfiniteUsers() {
  return useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: ({ pageParam = 1 }) => 
      useUsers.queryFn({ query: { page: pageParam, per_page: 20 } }),
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.meta.current_page + 1
      return nextPage <= lastPage.meta.last_page ? nextPage : undefined
    },
    initialPageParam: 1
  })
}
```
### 15. Bundle Splitting & Code Splitting

**Lazy Loading Generated SDK:**
```typescript
// utils/lazyAPI.ts
export const lazyAPI = {
  // Lazy load user endpoints
  get users() {
    return import('@/api/endpoints/users').then(m => m.users)
  },
  
  // Lazy load product endpoints  
  get products() {
    return import('@/api/endpoints/products').then(m => m.products)
  },
  
  // Lazy load cart endpoints
  get cart() {
    return import('@/api/endpoints/cart').then(m => m.cart)
  }
}

// Usage with React.lazy
const UsersPage = React.lazy(() => 
  Promise.all([
    import('./UsersPage'),
    import('@/api/endpoints/users')
  ]).then(([component, api]) => ({
    default: component.default
  }))
)
```

**Route-based Code Splitting:**
```tsx
// app/users/page.tsx (Next.js App Router)
import dynamic from 'next/dynamic'

// Dynamically import components yang use specific API endpoints
const UsersList = dynamic(() => import('../../components/UsersList'), {
  loading: () => <UsersListSkeleton />,
  ssr: false // Skip SSR jika tidak diperlukan
})

const CreateUserForm = dynamic(() => import('../../components/CreateUserForm'), {
  loading: () => <FormSkeleton />
})

export default function UsersPage() {
  return (
    <div>
      <h1>Users Management</h1>
      <UsersList />
      <CreateUserForm />
    </div>
  )
}
```

## Production Deployment Examples

### 16. Environment-specific Configuration

**Multi-environment Setup:**
```typescript
// config/api.ts
import { createClient } from 'routesync'

const config = {
  development: {
    baseURL: 'http://localhost:8000/api',
    debug: true,
    timeout: 10000
  },
  staging: {
    baseURL: 'https://api.staging.myapp.com/api',
    debug: false,
    timeout: 15000
  },
  production: {
    baseURL: 'https://api.myapp.com/api',
    debug: false,
    timeout: 30000,
    retries: 3
  }
}

const environment = process.env.NODE_ENV as keyof typeof config
const apiConfig = config[environment] || config.development

export const client = createClient({
  ...apiConfig,
  
  // Error tracking
  onError: (error) => {
    if (environment === 'production') {
      // Send to error tracking service
      console.error('API Error:', error)
    }
  },
  
  // Performance monitoring
  onRequest: (config) => {
    if (environment === 'production') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  
  // Response interceptor
  onResponse: (response) => {
    if (environment === 'production' && response.config?.metadata?.trackTime) {
      const duration = Date.now() - response.config.metadata.startTime
      console.log(`API Response: ${response.config.url} took ${duration}ms`)
    }
    return response
  }
})
```

### 17. CI/CD Integration

**GitHub Actions dengan RouteSync:**
```yaml
# .github/workflows/frontend-deploy.yml
name: Frontend Deploy

on:
  push:
    branches: [main]

jobs:
  generate-sdk:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install RouteSync CLI
        run: npm install -g routesync@latest
        
      - name: Download Manifest from Backend
        run: |
          curl -H "Authorization: Bearer ${{ secrets.API_TOKEN }}" \
               -o routesync.manifest.json \
               "${{ secrets.BACKEND_URL }}/api/routesync/manifest"
        
      - name: Generate SDK
        run: |
          routesync generate \
            --manifest routesync.manifest.json \
            --output src/api \
            --next-actions \
            --zod \
            --production
            
      - name: Verify Generated Code
        run: |
          npx tsc --noEmit
          npm run lint src/api/
          
      - name: Build Application
        run: |
          npm ci
          npm run build
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Advanced Integration Examples

### 18. GraphQL + REST Hybrid

**Mixed API Architecture:**
```typescript
// utils/hybridClient.ts
import { createClient } from 'routesync'
import { GraphQLClient } from 'graphql-request'

// REST client untuk standard CRUD
export const restClient = createClient({
  baseURL: '/api/v1',
  // Standard RouteSync configuration
})

// GraphQL client untuk complex queries
export const graphqlClient = new GraphQLClient('/graphql')

// Hybrid hooks
export function useHybridUsers() {
  // Use REST untuk simple operations
  const { users, ...restMethods } = useUsers()
  
  // Use GraphQL untuk complex queries
  const { data: usersWithStats } = useQuery({
    queryKey: ['users', 'with-stats'],
    queryFn: () => graphqlClient.request(`
      query UsersWithStats {
        users {
          id
          name
          email
          postsCount
          lastActiveAt
          followers {
            count
          }
        }
      }
    `)
  })
  
  return {
    // Simple user data dari REST
    users,
    // Complex data dari GraphQL  
    usersWithStats,
    // REST methods
    ...restMethods
  }
}
```

### 19. WebSocket + HTTP Integration

**Real-time Updates dengan WebSocket:**
```typescript
// hooks/useRealTimeCart.ts
import { useCart } from '@/api'
import { useWebSocket } from './useWebSocket'
import { useQueryClient } from '@tanstack/react-query'

export function useRealTimeCart() {
  const queryClient = useQueryClient()
  const { cart, ...cartMethods } = useCart()
  
  // WebSocket untuk real-time updates
  const { lastMessage } = useWebSocket('/ws/cart', {
    onMessage: (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'cart_updated') {
        // Update cart cache dengan data dari WebSocket
        queryClient.setQueryData(['cart'], data.cart)
      }
      
      if (data.type === 'item_added') {
        // Optimistically update cache
        queryClient.setQueryData(['cart'], (old: any) => ({
          ...old,
          items: [...old.items, data.item],
          items_count: old.items_count + 1
        }))
      }
    }
  })
  
  return {
    cart,
    ...cartMethods,
    isConnected: !!lastMessage
  }
}
```

## Summary

Examples ini menunjukkan **penggunaan praktis RouteSync** dari basic CRUD sampai advanced scenarios:

### Key Benefits Demonstrated:
- **Zero Boilerplate**: Generated hooks langsung bisa digunakan
- **Type Safety**: Full TypeScript support di semua level
- **Performance**: Built-in caching, optimistic updates, lazy loading
- **Developer Experience**: MSW integration, error boundaries, loading states
- **Production Ready**: Environment config, CI/CD integration, monitoring

### Best Practices Covered:
- **Testing Strategy**: Unit, integration, E2E dengan MSW
- **Error Handling**: Boundaries, fallbacks, retry logic
- **Performance**: Caching, prefetching, code splitting
- **Real-world Patterns**: Authentication, file upload, notifications
- **Production Deployment**: Multi-environment, CI/CD, monitoring

RouteSync menyediakan **foundation yang solid** untuk membangun frontend applications yang **scalable**, **type-safe**, dan **maintainable**.
```