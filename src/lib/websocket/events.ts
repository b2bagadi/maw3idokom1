export const WSEvents = {
    // Client → Server
    CLIENT_NEW_REQUEST: 'client:new_request',
    CLIENT_SELECT_BUSINESS: 'client:select_business',
    CLIENT_COMPLETE_BOOKING: 'client:complete_booking',
    CLIENT_SUBMIT_RATING: 'client:submit_rating',
    CLIENT_AUTH: 'client:auth',

    // Server → Client
    BUSINESS_REQUEST_RECEIVED: 'business:request_received',
    BUSINESS_SELECTED: 'business:selected',
    BUSINESS_NOT_SELECTED: 'business:not_selected',
    BOOKING_COMPLETED: 'booking:completed',
    RATING_REQUIRED: 'rating:required',
    RATING_UPDATED: 'rating:updated',

    // Quick Find events
    QUICKFIND_REQUEST_SENT: 'quickfind:request_sent',
    QUICKFIND_BUSINESS_ACCEPTED: 'quickfind:business_accepted',
    QUICKFIND_BUSINESS_REJECTED: 'quickfind:business_rejected',
    QUICKFIND_SESSION_EXPIRED: 'quickfind:session_expired',
    QUICKFIND_CONFIRMED: 'quickfind:confirmed',
    REQUEST_OFFERED: 'request_offered', // Keep legacy name temporarily or map it
} as const;

export type WSEventType = typeof WSEvents[keyof typeof WSEvents];
