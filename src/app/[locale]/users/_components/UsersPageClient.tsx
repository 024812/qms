'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, Pencil, Plus, Shield, Trash2, User, Users } from 'lucide-react';

import { useToast } from '@/hooks/useToast';
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from '@/hooks/useUsers';
import type { UserModule, UserSummary } from '@/lib/data/users';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UsersPageClientProps {
  currentUserId: string;
  initialUsers: UserSummary[];
}

interface UserFormState {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'member';
  activeModules: UserModule[];
}

const emptyFormState: UserFormState = {
  name: '',
  email: '',
  password: '',
  role: 'member',
  activeModules: [],
};

export function UsersPageClient({ currentUserId, initialUsers }: UsersPageClientProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';
  const { success, error } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [formData, setFormData] = useState<UserFormState>(emptyFormState);

  const usersQuery = useUsers({
    initialData: {
      users: initialUsers,
      total: initialUsers.length,
    },
  });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const availableModules = useMemo(
    () => [
      { id: 'quilts' as const, name: t('users.modules.quilts') },
      { id: 'cards' as const, name: t('users.modules.cards') },
    ],
    [t]
  );

  const users = usersQuery.data?.users ?? initialUsers;
  const loading = usersQuery.isLoading && users.length === 0;
  const saving = createUser.isPending || updateUser.isPending || deleteUser.isPending;

  const resetForm = () => {
    setFormData(emptyFormState);
    setSelectedUser(null);
  };

  const handleCreate = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleEdit = (user: UserSummary) => {
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

  const handleDelete = (user: UserSummary) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const toggleModule = (moduleId: UserModule) => {
    setFormData(previous => ({
      ...previous,
      activeModules: previous.activeModules.includes(moduleId)
        ? previous.activeModules.filter(module => module !== moduleId)
        : [...previous.activeModules, moduleId],
    }));
  };

  const submitCreate = async () => {
    try {
      await createUser.mutateAsync(formData);
      success(t('common.success'), t('actions.createdSuccessfully'));
      setCreateDialogOpen(false);
      resetForm();
    } catch (caughtError) {
      error(
        t('common.error'),
        caughtError instanceof Error ? caughtError.message : t('actions.failedToCreate')
      );
    }
  };

  const submitEdit = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      await updateUser.mutateAsync({
        id: selectedUser.id,
        ...formData,
      });
      success(t('common.success'), t('actions.updatedSuccessfully'));
      setEditDialogOpen(false);
      resetForm();
    } catch (caughtError) {
      error(
        t('common.error'),
        caughtError instanceof Error ? caughtError.message : t('actions.failedToUpdate')
      );
    }
  };

  const submitDelete = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      await deleteUser.mutateAsync({ id: selectedUser.id });
      success(t('common.success'), t('actions.deletedSuccessfully'));
      setDeleteDialogOpen(false);
      resetForm();
    } catch (caughtError) {
      error(
        t('common.error'),
        caughtError instanceof Error ? caughtError.message : t('actions.failedToDelete')
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{t('users.title')}</h1>
            <p className="text-muted-foreground">{t('users.subtitle')}</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('users.add')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{t('users.listTitle')}</CardTitle>
                <CardDescription>{t('users.totalCount', { count: users.length })}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">{t('users.empty')}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('users.table.name')}</TableHead>
                    <TableHead>{t('users.table.email')}</TableHead>
                    <TableHead>{t('users.table.role')}</TableHead>
                    <TableHead>{t('users.table.modules')}</TableHead>
                    <TableHead>{t('users.table.created')}</TableHead>
                    <TableHead className="text-right">{t('users.table.actions')}</TableHead>
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
                            <Shield className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          {user.role === 'admin' ? t('users.roles.admin') : t('users.roles.member')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.activeModules.length === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              {t('users.table.noModules')}
                            </span>
                          ) : (
                            user.activeModules.map(moduleId => {
                              const activeModule = availableModules.find(
                                item => item.id === moduleId
                              );
                              return (
                                <Badge key={moduleId} variant="outline" className="text-xs">
                                  {activeModule?.name ?? moduleId}
                                </Badge>
                              );
                            })
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString(dateLocale)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            disabled={user.id === currentUserId}
                          >
                            <Trash2 className="h-4 w-4" />
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

        <Dialog
          open={createDialogOpen}
          onOpenChange={open => {
            setCreateDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('users.dialogs.create.title')}</DialogTitle>
              <DialogDescription>{t('users.dialogs.create.desc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">{t('users.dialogs.fields.name')} *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={event => setFormData({ ...formData, name: event.target.value })}
                  placeholder={t('users.dialogs.fields.namePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">{t('users.dialogs.fields.email')} *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={event => setFormData({ ...formData, email: event.target.value })}
                  placeholder={t('users.dialogs.fields.emailPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">{t('users.dialogs.fields.password')} *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={formData.password}
                  onChange={event => setFormData({ ...formData, password: event.target.value })}
                  placeholder={t('users.dialogs.fields.passwordPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">{t('users.dialogs.fields.role')}</Label>
                <Select
                  value={formData.role}
                  onValueChange={role =>
                    setFormData({ ...formData, role: role as UserFormState['role'] })
                  }
                >
                  <SelectTrigger id="create-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">{t('users.roles.member')}</SelectItem>
                    <SelectItem value="admin">{t('users.roles.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('users.dialogs.fields.modules')}</Label>
                <div className="space-y-2">
                  {availableModules.map(module => (
                    <div key={module.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`create-module-${module.id}`}
                        checked={formData.activeModules.includes(module.id)}
                        onCheckedChange={() => toggleModule(module.id)}
                      />
                      <label
                        htmlFor={`create-module-${module.id}`}
                        className="text-sm font-medium leading-none"
                      >
                        {module.name}
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
                {t('common.cancel')}
              </Button>
              <Button
                onClick={submitCreate}
                disabled={saving || !formData.name || !formData.email || !formData.password}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('common.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={editDialogOpen}
          onOpenChange={open => {
            setEditDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('users.dialogs.edit.title')}</DialogTitle>
              <DialogDescription>{t('users.dialogs.edit.desc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('users.dialogs.fields.name')}</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={event => setFormData({ ...formData, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t('users.dialogs.fields.email')}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={event => setFormData({ ...formData, email: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">{t('users.dialogs.fields.newPassword')}</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={event => setFormData({ ...formData, password: event.target.value })}
                  placeholder={t('users.dialogs.fields.newPasswordPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">{t('users.dialogs.fields.role')}</Label>
                <Select
                  value={formData.role}
                  onValueChange={role =>
                    setFormData({ ...formData, role: role as UserFormState['role'] })
                  }
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">{t('users.roles.member')}</SelectItem>
                    <SelectItem value="admin">{t('users.roles.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('users.dialogs.fields.modules')}</Label>
                <div className="space-y-2">
                  {availableModules.map(module => (
                    <div key={module.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-module-${module.id}`}
                        checked={formData.activeModules.includes(module.id)}
                        onCheckedChange={() => toggleModule(module.id)}
                      />
                      <label
                        htmlFor={`edit-module-${module.id}`}
                        className="text-sm font-medium leading-none"
                      >
                        {module.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button onClick={submitEdit} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={open => {
            setDeleteDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('users.dialogs.delete.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('users.dialogs.delete.desc', { name: selectedUser?.name || 'User' })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={submitDelete}
                disabled={saving}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
