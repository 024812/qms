'use client';

import { useState } from 'react';
import { PackageOpen } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export default function CardsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    playerName: '',
    sport: 'BASKETBALL',
    year: new Date().getFullYear(),
    brand: '',
  });

  const handleAddCard = () => {
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // TODO: Implement save logic
    console.log('Saving card:', formData);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">球星卡管理</h1>
          <p className="text-muted-foreground mt-1">管理体育球星卡收藏，追踪价值和评级信息</p>
        </div>
        <Button onClick={handleAddCard}>
          <Plus className="mr-2 h-4 w-4" />
          添加球星卡
        </Button>
      </div>

      <EmptyState
        icon={PackageOpen}
        title="暂无球星卡"
        description="开始添加您的球星卡收藏"
        action={{
          label: '添加球星卡',
          onClick: handleAddCard,
        }}
      />

      {/* Add Card Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加球星卡</DialogTitle>
            <DialogDescription>
              填写球星卡的基本信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Player Name */}
            <div className="space-y-2">
              <Label htmlFor="playerName">球员姓名 *</Label>
              <Input
                id="playerName"
                placeholder="例如：Michael Jordan"
                value={formData.playerName}
                onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
              />
            </div>

            {/* Sport */}
            <div className="space-y-2">
              <Label htmlFor="sport">运动类型 *</Label>
              <Select
                value={formData.sport}
                onValueChange={(value) => setFormData({ ...formData, sport: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASKETBALL">篮球</SelectItem>
                  <SelectItem value="SOCCER">足球</SelectItem>
                  <SelectItem value="OTHER">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">年份 *</Label>
              <Input
                id="year"
                type="number"
                placeholder="例如：1986"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand">品牌 *</Label>
              <Input
                id="brand"
                placeholder="例如：Fleer, Topps, Panini"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
