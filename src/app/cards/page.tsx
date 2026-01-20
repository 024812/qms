'use client';

import { useState, useEffect } from 'react';
import { PackageOpen, Plus, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { CardCard } from '@/modules/cards/ui/CardCard';
import type { CardItem } from '@/modules/cards/schema';
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
import { Textarea } from '@/components/ui/textarea';

export default function CardsPage() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    playerName: '',
    sport: 'BASKETBALL' as const,
    team: '',
    position: '',
    year: new Date().getFullYear(),
    brand: '',
    series: '',
    cardNumber: '',
    gradingCompany: 'UNGRADED' as const,
    grade: '',
    certificationNumber: '',
    purchasePrice: '',
    purchaseDate: '',
    currentValue: '',
    estimatedValue: '',
    parallel: '',
    serialNumber: '',
    isAutographed: false,
    hasMemorabilia: false,
    memorabiliaType: '',
    status: 'COLLECTION' as const,
    location: '',
    storageType: '',
    condition: '',
    notes: '',
  });

  // Fetch cards on mount
  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cards');
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards || []);
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = () => {
    setFormData({
      playerName: '',
      sport: 'BASKETBALL',
      team: '',
      position: '',
      year: new Date().getFullYear(),
      brand: '',
      series: '',
      cardNumber: '',
      gradingCompany: 'UNGRADED',
      grade: '',
      certificationNumber: '',
      purchasePrice: '',
      purchaseDate: '',
      currentValue: '',
      estimatedValue: '',
      parallel: '',
      serialNumber: '',
      isAutographed: false,
      hasMemorabilia: false,
      memorabiliaType: '',
      status: 'COLLECTION',
      location: '',
      storageType: '',
      condition: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCards();
        setDialogOpen(false);
      } else {
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('Failed to save card:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

      {cards.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="暂无球星卡"
          description="开始添加您的球星卡收藏"
          action={{
            label: '添加球星卡',
            onClick: handleAddCard,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <CardCard key={card.id} item={card} />
          ))}
        </div>
      )}

      {/* Add Card Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加球星卡</DialogTitle>
            <DialogDescription>填写球星卡的详细信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Player Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">球员信息</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="playerName">球员姓名 *</Label>
                  <Input
                    id="playerName"
                    placeholder="例如：Michael Jordan"
                    value={formData.playerName}
                    onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sport">运动类型 *</Label>
                  <Select
                    value={formData.sport}
                    onValueChange={(value: any) => setFormData({ ...formData, sport: value })}
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

                <div className="space-y-2">
                  <Label htmlFor="team">球队</Label>
                  <Input
                    id="team"
                    placeholder="例如：Chicago Bulls"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">位置</Label>
                  <Input
                    id="position"
                    placeholder="例如：SG"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Card Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">卡片信息</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">年份 *</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="例如：1986"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">品牌 *</Label>
                  <Input
                    id="brand"
                    placeholder="例如：Fleer, Topps"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="series">系列</Label>
                  <Input
                    id="series"
                    placeholder="例如：Rookie Card"
                    value={formData.series}
                    onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">卡号</Label>
                  <Input
                    id="cardNumber"
                    placeholder="例如：57"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Grading Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">评级信息</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gradingCompany">评级公司</Label>
                  <Select
                    value={formData.gradingCompany}
                    onValueChange={(value: any) => setFormData({ ...formData, gradingCompany: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNGRADED">未评级</SelectItem>
                      <SelectItem value="PSA">PSA</SelectItem>
                      <SelectItem value="BGS">BGS (Beckett)</SelectItem>
                      <SelectItem value="SGC">SGC</SelectItem>
                      <SelectItem value="CGC">CGC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">评级分数</Label>
                  <Input
                    id="grade"
                    type="number"
                    step="0.5"
                    placeholder="例如：9.5"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                placeholder="其他说明信息"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.playerName || !formData.brand}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
