"use client";

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaintenanceTasksForCalendar, createMaintenanceTask, updateMaintenanceTask, deleteMaintenanceTask, MaintenanceTaskWithDetails } from '@/services/maintenanceService';
import { getAssets, Tables } from '@/services/assetService';
import { useSession } from '@/components/SessionContextProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Enums, TablesInsert } from '@/types/supabase';

const maintenanceStatuses: Enums<'maintenance_status'>[] = ['Scheduled', 'In Progress', 'Completed'];

const MaintenanceCalendar: React.FC = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.user?.id;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTaskWithDetails | null>(null);

  // New Task states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssetId, setNewTaskAssetId] = useState('');
  const [newTaskScheduledDate, setNewTaskScheduledDate] = useState<Date | undefined>(undefined);
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [newTaskChecklistItems, setNewTaskChecklistItems] = useState<string[]>([]);
  const [currentChecklistItem, setCurrentChecklistItem] = useState('');

  // Edit Task states
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskAssetId, setEditTaskAssetId] = useState('');
  const [editTaskScheduledDate, setEditTaskScheduledDate] = useState<Date | undefined>(undefined);
  const [editTaskAssignedTo, setEditTaskAssignedTo] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState<Enums<'maintenance_status'>>('Scheduled');
  const [editTaskChecklistItems, setEditTaskChecklistItems] = useState<Tables<'maintenance_checklist_items'>[]>([]);
  const [newEditChecklistItem, setNewEditChecklistItem] = useState('');
  const [checklistItemsToDelete, setChecklistItemsToDelete] = useState<string[]>([]);

  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => getAssets(),
    enabled: !!userId,
  });

  const { data: maintenanceTasks, isLoading: isLoadingTasks, error: tasksError } = useQuery({
    queryKey: ['maintenanceTasks', userId],
    queryFn: () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return getMaintenanceTasksForCalendar(startOfMonth, endOfMonth, userId!);
    },
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: ({ task, checklistItems }: { task: Omit<TablesInsert<'maintenance_tasks'>, 'user_id'> & { user_id: string }, checklistItems: Omit<TablesInsert<'maintenance_checklist_items'>, 'task_id'>[] }) =>
      createMaintenanceTask(task, checklistItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTasks'] });
      toast.success('Maintenance task created successfully!');
      setIsCreateDialogOpen(false);
      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssetId('');
      setNewTaskScheduledDate(undefined);
      setNewTaskAssignedTo('');
      setNewTaskChecklistItems([]);
      setCurrentChecklistItem('');
    },
    onError: (err) => {
      toast.error(`Failed to create task: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, task, checklistItemsToUpdate, checklistItemsToDelete, checklistItemsToAdd }: {
      id: string;
      task: Partial<TablesInsert<'maintenance_tasks'>>;
      checklistItemsToUpdate: Tables<'maintenance_checklist_items'>[];
      checklistItemsToDelete: string[];
      checklistItemsToAdd: Omit<TablesInsert<'maintenance_checklist_items'>, 'task_id'>[];
    }) => updateMaintenanceTask(id, task, checklistItemsToUpdate, checklistItemsToDelete, checklistItemsToAdd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTasks'] });
      toast.success('Maintenance task updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedTask(null);
      setChecklistItemsToDelete([]);
    },
    onError: (err) => {
      toast.error(`Failed to update task: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenanceTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTasks'] });
      toast.success('Maintenance task deleted successfully!');
    },
    onError: (err) => {
      toast.error(`Failed to delete task: ${err.message}`);
    },
  });

  const handleAddChecklistItem = () => {
    if (currentChecklistItem.trim()) {
      setNewTaskChecklistItems(prev => [...prev, currentChecklistItem.trim()]);
      setCurrentChecklistItem('');
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setNewTaskChecklistItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateTask = () => {
    if (!newTaskTitle || !newTaskAssetId || !newTaskScheduledDate) {
      toast.error('Title, Asset, and Scheduled Date are required.');
      return;
    }
    if (!userId) {
      toast.error("User must be logged in to create a task.");
      return;
    }

    createMutation.mutate({
      task: {
        title: newTaskTitle,
        description: newTaskDescription || null,
        asset_id: newTaskAssetId,
        scheduled_date: format(newTaskScheduledDate, 'yyyy-MM-dd'),
        assigned_to: newTaskAssignedTo || null,
        status: 'Scheduled',
        user_id: userId,
      },
      checklistItems: newTaskChecklistItems.map(desc => ({ description: desc })),
    });
  };

  const handleEventClick = (clickInfo: any) => {
    const taskId = clickInfo.event.id;
    const task = maintenanceTasks?.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setEditTaskTitle(task.title);
      setEditTaskDescription(task.description || '');
      setEditTaskAssetId(task.asset_id);
      setEditTaskScheduledDate(new Date(task.scheduled_date));
      setEditTaskAssignedTo(task.assigned_to || '');
      setEditTaskStatus(task.status);
      setEditTaskChecklistItems(task.maintenance_checklist_items || []);
      setChecklistItemsToDelete([]);
      setNewEditChecklistItem('');
      setIsEditDialogOpen(true);
    }
  };

  const handleAddEditChecklistItem = () => {
    if (newEditChecklistItem.trim()) {
      setEditTaskChecklistItems(prev => [...prev, {
        id: `new-${Date.now()}`, // Temporary ID for new items
        task_id: selectedTask?.id || '',
        description: newEditChecklistItem.trim(),
        is_completed: false,
        created_at: new Date().toISOString(),
      }]);
      setNewEditChecklistItem('');
    }
  };

  const handleRemoveEditChecklistItem = (itemId: string) => {
    setEditTaskChecklistItems(prev => prev.filter(item => {
      if (item.id === itemId) {
        // If it's an existing item, mark for deletion from DB
        if (!item.id.startsWith('new-')) {
          setChecklistItemsToDelete(old => [...old, itemId]);
        }
        return false; // Remove from current state
      }
      return true;
    }));
  };

  const handleToggleChecklistItem = (itemId: string) => {
    setEditTaskChecklistItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, is_completed: !item.is_completed } : item
    ));
  };

  const handleSaveEditTask = () => {
    if (!selectedTask) return;
    if (!editTaskTitle || !editTaskAssetId || !editTaskScheduledDate) {
      toast.error('Title, Asset, and Scheduled Date are required.');
      return;
    }

    const updatedChecklistItems = editTaskChecklistItems.filter(item => !item.id.startsWith('new-'));
    const newChecklistItems = editTaskChecklistItems.filter(item => item.id.startsWith('new-')).map(item => ({ description: item.description, is_completed: item.is_completed }));

    updateMutation.mutate({
      id: selectedTask.id,
      task: {
        title: editTaskTitle,
        description: editTaskDescription || null,
        asset_id: editTaskAssetId,
        scheduled_date: format(editTaskScheduledDate, 'yyyy-MM-dd'),
        assigned_to: editTaskAssignedTo || null,
        status: editTaskStatus,
      },
      checklistItemsToUpdate: updatedChecklistItems,
      checklistItemsToDelete: checklistItemsToDelete,
      checklistItemsToAdd: newChecklistItems,
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteMutation.mutate(taskId);
    setIsEditDialogOpen(false);
    setSelectedTask(null);
  };

  const calendarEvents = maintenanceTasks?.map(task => ({
    id: task.id,
    title: task.title,
    date: task.scheduled_date,
    color: task.status === 'Completed' ? '#22C55E' : task.status === 'In Progress' ? '#3B82F6' : '#F59E0B', // Tailwind colors
  })) || [];

  if (isLoadingAssets || isLoadingTasks) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-xl text-gray-600 dark:text-gray-400">Loading maintenance calendar...</p>
    </div>
  );
  if (tasksError) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-xl text-red-600">Error loading tasks: {tasksError.message}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl space-y-8">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Maintenance Calendar</CardTitle>
              <CardDescription>View and manage scheduled maintenance tasks.</CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Task
            </Button>
          </CardHeader>
          <CardContent>
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              eventClick={handleEventClick}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek,dayGridDay'
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Maintenance Task</DialogTitle>
            <DialogDescription>Fill in the details for a new maintenance task.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-task-title" className="text-right">Title</Label>
              <Input id="new-task-title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-task-description" className="text-right">Description</Label>
              <Input id="new-task-description" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-task-asset" className="text-right">Asset</Label>
              <Select value={newTaskAssetId} onValueChange={setNewTaskAssetId}>
                <SelectTrigger id="new-task-asset" className="col-span-3">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets?.map(asset => (
                    <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-task-date" className="text-right">Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal col-span-3",
                      !newTaskScheduledDate && "text-muted-foreground"
                    )}
                  >
                    {newTaskScheduledDate ? format(newTaskScheduledDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newTaskScheduledDate}
                    onSelect={setNewTaskScheduledDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-task-assigned-to" className="text-right">Assigned To</Label>
              <Input id="new-task-assigned-to" value={newTaskAssignedTo} onChange={(e) => setNewTaskAssignedTo(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="new-task-checklist" className="text-right pt-2">Checklist</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="new-task-checklist"
                    placeholder="Add checklist item"
                    value={currentChecklistItem}
                    onChange={(e) => setCurrentChecklistItem(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
                  />
                  <Button type="button" onClick={handleAddChecklistItem} size="icon">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="space-y-1">
                  {newTaskChecklistItems.map((item, index) => (
                    <li key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-md">
                      <span>{item}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveChecklistItem(index)}>
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      {selectedTask && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Maintenance Task</DialogTitle>
              <DialogDescription>Update task details, status, and checklist.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-task-title" className="text-right">Title</Label>
                <Input id="edit-task-title" value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-task-description" className="text-right">Description</Label>
                <Input id="edit-task-description" value={editTaskDescription} onChange={(e) => setEditTaskDescription(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-task-asset" className="text-right">Asset</Label>
                <Select value={editTaskAssetId} onValueChange={setEditTaskAssetId}>
                  <SelectTrigger id="edit-task-asset" className="col-span-3">
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets?.map(asset => (
                      <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-task-date" className="text-right">Scheduled Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal col-span-3",
                        !editTaskScheduledDate && "text-muted-foreground"
                      )}
                    >
                      {editTaskScheduledDate ? format(editTaskScheduledDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editTaskScheduledDate}
                      onSelect={setEditTaskScheduledDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-task-assigned-to" className="text-right">Assigned To</Label>
                <Input id="edit-task-assigned-to" value={editTaskAssignedTo} onChange={(e) => setEditTaskAssignedTo(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-task-status" className="text-right">Status</Label>
                <Select value={editTaskStatus} onValueChange={(value: Enums<'maintenance_status'>) => setEditTaskStatus(value)}>
                  <SelectTrigger id="edit-task-status" className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-task-checklist" className="text-right pt-2">Checklist</Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="edit-task-checklist"
                      placeholder="Add new checklist item"
                      value={newEditChecklistItem}
                      onChange={(e) => setNewEditChecklistItem(e.target.value)}
                      onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEditChecklistItem(); } }}
                    />
                    <Button type="button" onClick={handleAddEditChecklistItem} size="icon">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <ul className="space-y-1">
                    {editTaskChecklistItems.map((item) => (
                      <li key={item.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-md">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={item.is_completed}
                            onChange={() => handleToggleChecklistItem(item.id)}
                            className="form-checkbox h-4 w-4 text-primary rounded"
                          />
                          <span className={item.is_completed ? 'line-through text-muted-foreground' : ''}>{item.description}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveEditChecklistItem(item.id)}>
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="destructive" onClick={() => handleDeleteTask(selectedTask.id)} disabled={deleteMutation.isPending}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Task
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEditTask} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default MaintenanceCalendar;