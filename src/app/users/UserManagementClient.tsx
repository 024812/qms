'use client';

/**
 * User Management Client Component
 *
 * Provides user management interface for admins:
 * - List all users
 * - Create new users
 * - Edit user details (name, email, password)
 * - Manage user roles (admin/member)
 * - Manage module subscriptions
 * - Delete users
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Plus, Pencil, Trash2, Loader2, Shield, User } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  activeModules: string[];
  createdAt: string;
  updatedAt: string;
}

interface UserManagementClientProps {
  currentUserId: string;
}

const AVAILABLE_MODULES = [
  { id: 'quilts', name: '被子管理' },
  { id: 'cards', name: '球星卡管理' },
];

export function UserManagementClient({ currentUserId }: UserManagementClientProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    activeModules: [] as string[],
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('[UserManagement] Fetching users from /api/users');
      const response = await fetch('/api/users');
      console.log('[UserManagement] Response status:', response.status);
      console.log('[UserManagement] Response ok:', response.ok);
      
      const data = await response.json();
      console.log('[UserManagement] Response data:', data);
      
      if (response.ok) {
        // API returns { success: true, data: { users: [...], total: ... } }
        const users = data.data?.users || data.users || [];
        setUsers(users);
        console.log('[UserManagement] Set users:', users.length);
      } else {
        console.error('[UserManagement] Error response:', data);
        error('错误', data.error?.message || '获取用户列表失败');
      }
    } catch (err) {
      console.error('[UserManagement] Failed to fetch users:', err);
      error('错误', '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle create user
  const handleCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'member',
      activeModules: [],
    });
    setCreateDialogOpen(true);
  };

  // Handle edit user
  const handleEdit = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      activeModules: user.activeModules,
    });
    setEditDialogOpen(true);
  };

  // Handle delete user
  const handleDelete = (user: UserData) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Submit create user
  const submitCreate = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        success('成功', '用户创建成功');
        setCreateDialogOpen(false);
        fetchUsers();
      } else {
        error('错误', data.message || '创建用户失败');
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      error('错误', '创建用户失败');
    } finally {
      setSaving(false);
    }
  };

  // Submit edit user
  const submitEdit = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        success('成功', '用户更新成功');
        setEditDialogOpen(false);
        fetchUsers();
      } else {
        error('错误', data.message || '更新用户失败');
      }
    } catch (err) {
      console.error('Failed to update user:', err);
      error('错误', '更新用户失败');
    } finally {
      setSaving(false);
    }
  };

  // Submit delete user
  const submitDelete = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        success('成功', '用户已删除');
        setDeleteDialogOpen(false);
        fetchUsers();
      } else {
        error('错误', data.message || '删除用户失败');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      error('错误', '删除用户失败');
    } finally {
      setSaving(false);
    }
  };

  // Toggle module subscription
  const toggleModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      activeModules: prev.activeModules.includes(moduleId)
        ? prev.activeModules.filter(m => m !== moduleId)
        : [...prev.activeModules, moduleId],
    }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">用户管理</h1>
            <p className="text-muted-foreground">管理系统用户和权限</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            添加用户
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>用户列表</CardTitle>
                <CardDescription>共 {users.length} 个用户</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无用户</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>订阅模块</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className="gap-1"
                        >
                          {user.role === 'admin' ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {user.role === 'admin' ? '管理员' : '成员'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.activeModules.length === 0 ? (
                            <span className="text-sm text-muted-foreground">无</span>
                          ) : (
                            user.activeModules.map(moduleId => {
                              const mod = AVAILABLE_MODULES.find(m => m.id === moduleId);
                              return (
                                <Badge key={moduleId} variant="outline" className="text-xs">
                                  {mod?.name || moduleId}
                                </Badge>
                              );
                            })
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            disabled={user.id === currentUserId}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>添加用户</DialogTitle>
              <DialogDescription>创建新的系统用户</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">姓名 *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">邮箱 *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">密码 *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="至少6个字符"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">角色</Label>
                <Select
                  value={formData.role}
                  onValueChange={role => setFormData({ ...formData, role })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">成员</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>订阅模块</Label>
                <div className="space-y-2">
                  {AVAILABLE_MODULES.map(mod => (
                    <div key={mod.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`create-module-${mod.id}`}
                        checked={formData.activeModules.includes(mod.id)}
                        onCheckedChange={() => toggleModule(mod.id)}
                      />
                      <label
                        htmlFor={`create-module-${mod.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {mod.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={saving}
              >
                取消
              </Button>
              <Button
                onClick={submitCreate}
                disabled={saving || !formData.name || !formData.email || !formData.password}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>编辑用户</DialogTitle>
              <DialogDescription>修改用户信息和权限</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">姓名</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">邮箱</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">新密码</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="留空则不修改"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">角色</Label>
                <Select
                  value={formData.role}
                  onValueChange={role => setFormData({ ...formData, role })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">成员</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>订阅模块</Label>
                <div className="space-y-2">
                  {AVAILABLE_MODULES.map(mod => (
                    <div key={mod.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-module-${mod.id}`}
                        checked={formData.activeModules.includes(mod.id)}
                        onCheckedChange={() => toggleModule(mod.id)}
                      />
                      <label
                        htmlFor={`edit-module-${mod.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {mod.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
                取消
              </Button>
              <Button onClick={submitEdit} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除用户 <strong>{selectedUser?.name}</strong> 吗？
                <br />
                此操作将同时删除该用户的所有数据，且无法恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={submitDelete}
                disabled={saving}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
