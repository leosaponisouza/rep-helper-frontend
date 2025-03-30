// src/styles/eventsStyles.ts
import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, createShadow } from './sharedStyles';

/**
 * Estilos específicos para o módulo de eventos
 * Complementa os estilos compartilhados
 */
export const eventsStyles = StyleSheet.create({
  // Lista de eventos
  eventItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    ...createShadow(2)
  },
  eventTimeContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  eventTime: {
    color: colors.primary.main,
    fontSize: 16,
    fontWeight: 'bold',
  },
  happeningNowBadge: {
    backgroundColor: colors.success.light,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  happeningNowText: {
    color: colors.success.main,
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventContent: {
    flex: 1,
    marginRight: 10,
  },
  eventTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginLeft: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    color: colors.text.tertiary,
    fontSize: 12,
    marginLeft: 4,
  },

  // Filtros
  filtersContainer: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 12,
    margin: 10,
    ...createShadow(3)
  },
  filtersTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
  },
  filterButtonActive: {
    backgroundColor: colors.primary.light,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterButtonText: {
    color: colors.text.tertiary,
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },

  // Seção do calendário
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 20,
  },
  calendarDayOtherMonth: {
    opacity: 0.4,
  },
  calendarDayToday: {
    backgroundColor: colors.primary.light,
  },
  calendarDaySelected: {
    backgroundColor: colors.primary.main,
  },
  calendarDayText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  calendarDayTextOtherMonth: {
    color: colors.text.tertiary,
  },
  calendarDayTextToday: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  calendarDayTextSelected: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  eventDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.main,
  },
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  dayOfWeekText: {
    color: colors.text.tertiary,
    fontSize: 14,
    fontWeight: '500',
    width: 32,
    textAlign: 'center',
  },

  // Tela de detalhes do evento
  eventDetailContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    margin: 16,
    padding: 20,
    ...createShadow(8)
  },
  eventStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(158, 158, 158, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  eventStatusText: {
    color: '#9E9E9E',
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventInfoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginBottom: 4,
  },
  infoText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  infoSecondaryText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
  },
  infoDurationText: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Descrição do evento
  descriptionContainer: {
    marginTop: 8,
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
  },
  descriptionLabel: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginBottom: 8,
  },
  descriptionText: {
    color: colors.text.primary,
    fontSize: 16,
    lineHeight: 24,
  },

  // Estatísticas
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.background.tertiary,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmedIconContainer: {
    backgroundColor: colors.success.light,
  },
  invitedIconContainer: {
    backgroundColor: colors.warning.light,
  },
  declinedIconContainer: {
    backgroundColor: colors.error.light,
  },
  statCount: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.text.tertiary,
    fontSize: 12,
  },

  // Seção de ações do usuário
  userActionsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
  },
  userActionsTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  userStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userStatusLabel: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginRight: 8,
  },
  userStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    marginTop: 8,
  },
  participationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: colors.success.main,
    ...createShadow(3, colors.success.main)
  },
  declineButton: {
    backgroundColor: colors.error.main,
    ...createShadow(3, colors.error.main)
  },
  confirmButtonText: {
    color: colors.text.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  declineButtonText: {
    color: colors.text.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Ações do criador do evento
  creatorActionsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
  },
  creatorActionsTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  creatorButtonsContainer: {
    marginTop: 8,
  },
  creatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: colors.primary.light,
    borderWidth: 1,
    borderColor: 'rgba(123, 104, 238, 0.3)',
  },
  creatorButtonText: {
    color: colors.primary.main,
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: colors.error.main,
    borderWidth: 0,
    ...createShadow(3, colors.error.main)
  },
  deleteButtonText: {
    color: colors.text.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },
  cancelButtonText: {
    color: colors.text.tertiary,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Data e hora nos formulários
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.background.paper,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '30%',
    borderWidth: 1,
    borderColor: colors.background.paper,
  },
  dateTimeText: {
    color: colors.text.primary,
    fontSize: 14,
    marginLeft: 8,
  },
  
  // Dicas
  tipsContainer: {
    backgroundColor: colors.primary.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(123, 104, 238, 0.2)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    color: colors.primary.main,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tipText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  
  // Convites
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },
  selectedMemberItem: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  memberInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitials: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberTextInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  memberStatusContainer: {
    marginLeft: 10,
  },
  invitedBadge: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  invitedText: {
    color: colors.primary.main,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.text.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  
  // Animações e transições
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(34, 34, 34, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },

  // Seleção de data
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  selectedDateInfo: {
    flex: 1,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  eventsCountText: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginTop: 4,
  },
  
  // Lista de eventos vazia
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    color: colors.text.primary,
    fontSize: 16,
    marginVertical: 16,
  },
  
  // Botão grande de criar evento
  createEventButtonLarge: {
    backgroundColor: colors.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    ...createShadow(4, colors.primary.main)
  },
  createEventButtonText: {
    color: colors.text.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Seleção de membros
  selectionInfo: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  selectionCount: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  
  // Botão de limpar pesquisa
  clearButton: {
    padding: 4,
  },
});

export default eventsStyles;
 