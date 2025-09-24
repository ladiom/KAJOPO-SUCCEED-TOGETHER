// Mock Supabase implementation for testing when CDN fails
console.log('Loading Supabase mock implementation...');

// Create a mock supabase object
window.supabase = {
    createClient: function(url, key) {
        console.log('Mock Supabase client created with URL:', url);
        return {
            auth: {
                signInWithPassword: async function({ email, password }) {
                    console.log('Mock auth.signInWithPassword called with:', email);
                    return {
                        data: { user: { email: email } },
                        error: null
                    };
                },
                signOut: function() {
                    console.log('Mock auth.signOut called');
                    return Promise.resolve();
                }
            },
            from: function(table) {
                console.log('Mock from() called with table:', table);
                return {
                    select: function(columns) {
                        console.log('Mock select() called with columns:', columns);
                        return {
                            eq: function(column, value) {
                                console.log('Mock eq() called with:', column, '=', value);
                                return {
                                    limit: function(count) {
                                        console.log('Mock limit() called with:', count);
                                        return Promise.resolve({
                                            data: [],
                                            error: null
                                        });
                                    },
                                    single: function() {
                                        console.log('Mock single() called');
                                        return Promise.resolve({
                                            data: null,
                                            error: null
                                        });
                                    }
                                };
                            },
                            insert: function(data) {
                                console.log('Mock insert() called with data:', data);
                                return {
                                    select: function() {
                                        console.log('Mock insert().select() called');
                                        return Promise.resolve({
                                            data: data,
                                            error: null
                                        });
                                    }
                                };
                            },
                            update: function(data) {
                                console.log('Mock update() called with data:', data);
                                return {
                                    eq: function(column, value) {
                                        console.log('Mock update().eq() called with:', column, '=', value);
                                        return {
                                            select: function() {
                                                console.log('Mock update().eq().select() called');
                                                return Promise.resolve({
                                                    data: [],
                                                    error: null
                                                });
                                            }
                                        };
                                    }
                                };
                            }
                        };
                    }
                };
            }
        };
    }
};

console.log('Mock Supabase implementation loaded successfully');

