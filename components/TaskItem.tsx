// Componente TaskItem (pode ser adicionado diretamente na tela de lista ou extraído para um arquivo separado)
const TaskItem = ({ item, onToggleStatus, onDelete }) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    
    const isAssignedToCurrentUser = item.assignedUsers?.some(u => u.id === user?.id);
    
    const handleToggleStatus = async () => {
      if (isLoading) return;
      
      setIsLoading(true);
      await onToggleStatus(item);
      setIsLoading(false);
    };
    
    const confirmDelete = () => {
      Alert.alert(
        'Excluir Tarefa',
        `Tem certeza que deseja excluir a tarefa "${item.title}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Excluir', 
            style: 'destructive', 
            onPress: () => onDelete(item.id) 
          }
        ]
      );
    };
  
    return (
      <TouchableOpacity
        style={[
          styles.taskItem, 
          item.status === 'COMPLETED' && styles.completedTask
        ]}
        onPress={() => router.push(`/tasks/${item.id}`)}
        disabled={isLoading}
      >
        <View style={[styles.statusBar, { backgroundColor: getStatusColor(item.status) }]} />
        
        <View style={styles.taskContent}>
          <TouchableOpacity 
            onPress={handleToggleStatus}
            style={styles.checkboxContainer}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#7B68EE" />
            ) : (
              <Ionicons 
                name={item.status === 'COMPLETED' ? 'checkbox' : 'checkbox-outline'} 
                size={24} 
                color={item.status === 'COMPLETED' ? '#7B68EE' : '#aaa'} 
              />
            )}
          </TouchableOpacity>
          
          {/* Resto do conteúdo do item... */}
        </View>
      </TouchableOpacity>
    );
  };