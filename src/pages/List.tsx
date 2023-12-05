import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonList,
  IonItem,
  IonCheckbox,
  IonLabel,
  IonButton,
  IonInput,
  IonTitle,
} from '@ionic/react';
import { from, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

import './List.css';

const List: React.FC = () => {
  // State pour gérer la liste des tâches actives
  const [tasks, setTasks] = useState<any[]>([]);

  // State pour gérer la liste des tâches complétées
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);

  // State pour gérer la nouvelle tâche à ajouter
  const [newTask, setNewTask] = useState<string>('');

  // Observable pour détruire le composant proprement
  const destroy$ = new Subject<void>();

  // Effet qui se déclenche lors du montage du composant
  useEffect(() => {
    // Observable pour récupérer les tâches depuis db.json
    const fetchData$ = from(fetchTasks()).pipe(
      takeUntil(destroy$),
      tap(updateTaskLists)
    );

    // Souscrire à l'observable pour récupérer les tâches
    fetchData$.subscribe();

    // Nettoyer l'observable lors du démontage du composant
    return () => {
      destroy$.next();
      destroy$.complete();
    };
  }, []);

  // Fonction asynchrone pour récupérer les tâches depuis l'API
  const fetchTasks = async () => {
    const apiUrl = 'http://localhost:3001/tasks';
    const response = await fetch(apiUrl);
    return response.json();
  };

  // Fonction pour mettre à jour les listes de tâches actives et complétées
  const updateTaskLists = (data: any[]) => {
    const activeTasks = data.filter((task) => !task.completed);
    const completedTasks = data.filter((task) => task.completed);

    setTasks(activeTasks);
    setCompletedTasks(completedTasks);
  };

  // Fonction asynchrone pour mettre à jour une tâche
  const updateTask = async (taskId: number, updatedFields: any) => {
    try {
      // Appel API pour mettre à jour la tâche
      await fetch(`http://localhost:3001/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFields),
      });

      // Mettre à jour les listes de tâches après la mise à jour
      fetchAndUpdateTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Fonction pour récupérer et mettre à jour les tâches
  const fetchAndUpdateTasks = () => fetchTasks().then(updateTaskLists);

  // Gérer le basculement de l'état de complétude d'une tâche
  const handleToggleComplete = async (taskId: number) => {
    try {
      const taskToToggle = tasks.find((task) => task.id === taskId);

      if (taskToToggle) {
        const updatedTask = { ...taskToToggle, completed: !taskToToggle.completed };

        // Mettre à jour les listes avec la tâche mise à jour
        setTasks((prevTasks) => [...prevTasks.filter((task) => task.id !== taskId), updatedTask]);
        setCompletedTasks((prevCompletedTasks) => [...prevCompletedTasks.filter((task) => task.id !== taskId), updatedTask]);

        // Appel API pour mettre à jour la tâche
        await updateTask(taskId, { completed: !taskToToggle.completed });
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  // Gérer le basculement de la validation d'une tâche
  const handleToggleValidation = async (taskId: number, isCompleted: boolean) => {
    try {
      const taskToToggle = isCompleted
        ? completedTasks.find((task) => task.id === taskId)
        : tasks.find((task) => task.id === taskId);

      if (taskToToggle) {
        const updatedTask = { ...taskToToggle, completed: !taskToToggle.completed };

        // Mettre à jour les listes avec la tâche mise à jour
        setTasks((prevTasks) => (isCompleted ? prevTasks : prevTasks.filter((task) => task.id !== taskId)));
        setCompletedTasks((prevCompletedTasks) =>
          isCompleted
            ? [...prevCompletedTasks.filter((task) => task.id !== taskId), updatedTask]
            : [...prevCompletedTasks, updatedTask]
        );

        // Appel API pour mettre à jour la tâche
        await updateTask(taskId, { completed: !taskToToggle.completed });
      }
    } catch (error) {
      console.error('Error toggling task validation:', error);
    }
  };

  // Gérer la suppression d'une tâche
  const handleDeleteTask = async (taskId: number, isCompleted: boolean) => {
    try {
      // Filtrer les tâches en fonction de l'ID pour les deux listes
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      setCompletedTasks((prevCompletedTasks) => prevCompletedTasks.filter((task) => task.id !== taskId));

      // Appel API pour supprimer la tâche
      await fetch(`http://localhost:3001/tasks/${taskId}`, {
        method: 'DELETE',
      });

      // Mettre à jour les listes après la suppression
      fetchAndUpdateTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Gérer l'ajout d'une nouvelle tâche
  const handleAddTask = async () => {
    try {
      if (newTask.trim() === '') return;

      // Créer un nouvel objet tâche
      const newTaskObj = {
        id: tasks.length + 1,
        title: newTask,
        completed: false,
      };

      // Mettre à jour la liste des tâches actives
      setTasks((prevTasks) => [...prevTasks, newTaskObj]);

      // Appel API pour ajouter la nouvelle tâche
      await fetch('http://localhost:3001/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTaskObj),
      });

      // Réinitialiser la nouvelle tâche après l'ajout
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Gérer l'invalidation d'une tâche complétée
  const handleInvalidateTask = async (taskId: number) => {
    try {
      // Trouver la tâche complétée à invalider
      const taskToInvalidate = completedTasks.find((task) => task.id === taskId);

      if (taskToInvalidate) {
        // Mettre à jour la liste des tâches actives avec la tâche complétée
        setTasks((prevTasks) => [...prevTasks, { ...taskToInvalidate, completed: false }]);

        // Filtrer la liste des tâches complétées pour retirer la tâche invalidée
        setCompletedTasks((prevCompletedTasks) => prevCompletedTasks.filter((task) => task.id !== taskId));

        // Appel API pour invalider la tâche
        await updateTask(taskId, { completed: false });
      }
    } catch (error) {
      console.error('Error invalidating task:', error);
    }
  };

  // Gérer le double-clic sur une tâche pour basculer l'état de validation
  const handleDoubleClick = (taskId: number, isCompleted: boolean) => {
    isCompleted ? handleToggleValidation(taskId, true) : handleToggleComplete(taskId);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Liste des tâches</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Formulaire pour ajouter une nouvelle tâche */}
        <IonItem>
          <IonInput 
            id="inputElement"
            placeholder="Ajouter une tâche"
            value={newTask}
            onIonChange={(e) => setNewTask(e.detail.value!)}
          />
          <IonButton onClick={handleAddTask}>Ajouter une tâche</IonButton>
        </IonItem>

        {/* Liste des tâches à réaliser */}
        <IonList>
          <IonTitle>Les tâches à réaliser</IonTitle>
          {tasks.map((task) => (
            <IonItem key={task.id}>
              {/* Checkbox pour basculer l'état de complétude */}
              <IonCheckbox checked={task.completed} onIonChange={() => handleToggleComplete(task.id)} />
              {/* Label de la tâche avec gestion du double-clic */}
              <IonLabel className={task.completed ? 'completed-task' : ''} onDoubleClick={() => handleDoubleClick(task.id, false)}>
                {task.title}
              </IonLabel>       
              {/* Bouton pour basculer l'état de validation */}
              <IonButton color="success" onClick={() => handleToggleValidation(task.id, false)}>
                {task.completed ? 'Invalider' : 'Valider'}
              </IonButton>
              {/* Bouton pour supprimer la tâche */}
              <IonButton color= "danger" onClick={() => handleDeleteTask(task.id, false)}>Supprimer</IonButton>
       
            </IonItem>
          ))}
        </IonList>

        {/* Liste des tâches déjà réalisées */}
        <IonList>
          <IonTitle>Les tâches déjà réalisées</IonTitle>
          {completedTasks.map((task) => (
            <IonItem key={task.id}>
              {/* Checkbox pour basculer l'état de validation */}
              <IonCheckbox checked={task.completed} onIonChange={() => handleToggleValidation(task.id, true)} />
              {/* Label de la tâche complétée avec gestion du double-clic */}
              <IonLabel className={task.completed ? 'completed-task' : ''} onDoubleClick={() => handleDoubleClick(task.id, true)}>
                {task.title}
              </IonLabel>

              {/* Bouton pour invalider la tâche complétée */}
              <IonButton color="warning" onClick={() => handleInvalidateTask(task.id)}>Invalider</IonButton>                            

            </IonItem>
          ))}
        </IonList>

      </IonContent>
    </IonPage>
  );
};

export default List;
