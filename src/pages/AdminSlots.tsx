import React, { useState } from 'react';
import { useSlots, useUpdateSlot } from '@/hooks/useSlots';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Slot } from '@/data/slots';

const TYPE_COLORS: Record<string, string> = {
  BRAND_BUILDING: 'bg-amber-600',
  BRAND_SCREEN: 'bg-blue-500',
  PRODUCT_PPL: 'bg-emerald-600',
  PATRON_TILE: 'bg-yellow-600',
};

const AdminSlots = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const { data: slots, isLoading, error } = useSlots();
  const updateSlot = useUpdateSlot();
  const navigate = useNavigate();
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ label: '', ownerType: '', ownerId: '', ownerName: '', ownerMessage: '' });

  if (authLoading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">인증 확인 중...</div>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const openEdit = (slot: Slot) => {
    setEditingSlot(slot);
    setForm({
      label: slot.label,
      ownerType: slot.ownerType,
      ownerId: slot.ownerId || '',
      ownerName: slot.ownerName || '',
      ownerMessage: slot.ownerMessage || '',
    });
  };

  const handleSave = async () => {
    if (!editingSlot) return;
    try {
      await updateSlot.mutateAsync({
        id: editingSlot.id,
        label: form.label,
        ownerType: form.ownerType,
        ownerId: form.ownerId,
        ownerName: form.ownerName,
        ownerMessage: form.ownerMessage,
      });
      toast.success('슬롯이 업데이트되었습니다');
      setEditingSlot(null);
    } catch (e: any) {
      toast.error('업데이트 실패: ' + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">🛠️ Slot Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">PLAZA 슬롯 관리 — label, ownerType, ownerId 수정 가능</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/world')}>
            ← 맵으로 돌아가기
          </Button>
        </div>

        {isLoading && <p className="text-muted-foreground">로딩 중...</p>}
        {error && <p className="text-destructive">에러: {(error as Error).message}</p>}

        {slots && (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">ID</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Owner Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map(slot => (
                  <TableRow key={slot.id}>
                    <TableCell className="font-mono text-xs">{slot.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{slot.zone}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${TYPE_COLORS[slot.type] || 'bg-muted'} text-xs text-white`}>
                        {slot.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{slot.label}</TableCell>
                    <TableCell>
                      <Badge variant={slot.ownerType === 'empty' ? 'outline' : 'default'} className="text-xs">
                        {slot.ownerType}
                      </Badge>
                    </TableCell>
                    <TableCell>{slot.ownerName || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(slot)}>
                        편집
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingSlot} onOpenChange={(open) => !open && setEditingSlot(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>슬롯 편집: {editingSlot?.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Label</Label>
                <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
              </div>
              <div>
                <Label>Owner Type</Label>
                <Select value={form.ownerType} onValueChange={v => setForm(f => ({ ...f, ownerType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empty">empty</SelectItem>
                    <SelectItem value="brand">brand</SelectItem>
                    <SelectItem value="patron">patron</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Owner ID</Label>
                <Input value={form.ownerId} onChange={e => setForm(f => ({ ...f, ownerId: e.target.value }))} placeholder="브랜드 ID 또는 유저 ID" />
              </div>
              <div>
                <Label>Owner Name</Label>
                <Input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} placeholder="표시될 이름" />
              </div>
              <div>
                <Label>Owner Message</Label>
                <Input value={form.ownerMessage} onChange={e => setForm(f => ({ ...f, ownerMessage: e.target.value }))} placeholder="후원 메시지 (PATRON_TILE)" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSlot(null)}>취소</Button>
              <Button onClick={handleSave} disabled={updateSlot.isPending}>
                {updateSlot.isPending ? '저장 중...' : '저장'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminSlots;
