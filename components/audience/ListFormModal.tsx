
import React, { useState, useEffect } from 'react';
import { Save, List, Trash2, Plus } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import ConfirmationModal from '../common/ConfirmationModal';

interface ListFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (listData: { name: string }, isNew: boolean) => void;
  onDelete?: (listId: string) => void;
  list?: any; // Optional, only present if editing
  isNew?: boolean; // New prop to indicate if creating a new list
}

const ListFormModal: React.FC<ListFormModalProps> = ({ isOpen, onClose, onSave, onDelete, list, isNew = false }) => {
  const [name, setName] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) { // Reset on open
        setName(list?.name || '');
    }
  }, [isOpen, list]);

  const handleConfirmDelete = () => {
      if (list && onDelete) {
          onDelete(list.id);
      }
      setIsConfirmOpen(false);
      onClose(); // Close parent modal as well
  };

  const handleSubmit = () => {
      if (!name.trim()) return;
      onSave({ name }, isNew);
      onClose();
  };

  return (
    <>
        <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isNew ? "Tạo danh sách mới" : "Chỉnh sửa Danh sách"}
        size="sm"
        footer={
            <div className="flex justify-between w-full items-center">
                {!isNew && onDelete && (
                    <Button 
                        variant="danger" 
                        icon={Trash2} 
                        className="bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none px-3"
                        onClick={() => setIsConfirmOpen(true)}
                    >
                        Xóa
                    </Button>
                )}
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={onClose}>Hủy</Button>
                    <Button 
                        icon={isNew ? Plus : Save} 
                        onClick={handleSubmit} 
                        disabled={!name.trim()}
                    >
                        {isNew ? 'Tạo danh sách' : 'Lưu thay đổi'}
                    </Button>
                </div>
            </div>
        }
        >
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm">
                    <List className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold text-indigo-900 uppercase">Static List</p>
                    <p className="text-[10px] text-indigo-600/80">Danh sách tĩnh không tự động cập nhật.</p>
                </div>
            </div>
            <Input 
                label="Tên danh sách" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                autoFocus
                placeholder="Ví dụ: Khách hàng thân thiết"
            />
        </div>
        </Modal>

        <ConfirmationModal
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Xóa danh sách này?"
            message="CẢNH BÁO: Hành động này sẽ gỡ tất cả thành viên khỏi danh sách này. Không thể hoàn tác."
            variant="danger"
            confirmLabel="Xóa danh sách"
        />
    </>
  );
};

export default ListFormModal;
