// Gedeelde CRUD helper functies

import { User } from '../types';
import { handleSupabaseError, handleGenericError } from './errorHandling';
import { supabase } from '../services/supabaseClient';

/**
 * Valideer dat gebruiker een organization_id heeft
 */
export const validateOrganizationId = (user: User | null): string | null => {
  if (!user?.organization_id) {
    alert('Organisatie ID ontbreekt. Log opnieuw in.');
    return null;
  }
  return user.organization_id;
};

/**
 * Generic CRUD handler voor Supabase operaties
 */
export interface CrudHandlerConfig<T> {
  tableName: string;
  user: User | null;
  entityName: string; // Voor error messages (bijv. 'voertuig', 'chauffeur')
  mapToDb: (entity: T, orgId: string) => any; // Converteer entity naar database formaat
  mapFromDb?: (dbData: any, entity: T) => T; // Optioneel: map terug naar entity formaat
}

/**
 * Generic update handler
 */
export const createUpdateHandler = <T extends { id: string }>(
  config: CrudHandlerConfig<T>
) => {
  return async (
    updatedEntity: T,
    setState: React.Dispatch<React.SetStateAction<T[]>>
  ): Promise<void> => {
    const orgId = validateOrganizationId(config.user);
    if (!orgId) return;

    try {
      const dbData = config.mapToDb(updatedEntity, orgId);
      
      const { error } = await supabase
        .from(config.tableName)
        .update(dbData)
        .eq('id', updatedEntity.id);

      if (error) {
        handleSupabaseError(error, `updating ${config.entityName}`);
        return;
      }

      setState(prev => prev.map(item => item.id === updatedEntity.id ? updatedEntity : item));
    } catch (error) {
      handleGenericError(error, `opslaan van ${config.entityName}`);
    }
  };
};

/**
 * Generic add handler
 */
export const createAddHandler = <T extends { id: string }>(
  config: CrudHandlerConfig<T>
) => {
  return async (
    newEntity: T,
    setState: React.Dispatch<React.SetStateAction<T[]>>
  ): Promise<void> => {
    const orgId = validateOrganizationId(config.user);
    if (!orgId) return;

    try {
      const entityWithOrg = { ...newEntity, organization_id: orgId };
      const dbData = config.mapToDb(entityWithOrg, orgId);

      const { data, error } = await supabase
        .from(config.tableName)
        .insert(dbData)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, `adding ${config.entityName}`);
        return;
      }

      // Als er een mapFromDb functie is, gebruik die, anders gebruik entityWithOrg
      const mappedEntity = config.mapFromDb 
        ? config.mapFromDb(data, entityWithOrg)
        : { ...entityWithOrg, id: data.id };

      setState(prev => [...prev, mappedEntity]);
    } catch (error) {
      handleGenericError(error, `toevoegen van ${config.entityName}`);
    }
  };
};

/**
 * Generic delete handler
 */
export const createDeleteHandler = <T extends { id: string }>(
  config: CrudHandlerConfig<T>
) => {
  return async (
    id: string,
    setState: React.Dispatch<React.SetStateAction<T[]>>
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from(config.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error, `deleting ${config.entityName}`);
        return;
      }

      setState(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      handleGenericError(error, `verwijderen van ${config.entityName}`);
    }
  };
};
