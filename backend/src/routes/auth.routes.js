async function authRoutes(fastify, options) {
    // POST /api/auth/login - Hardcoded login
    fastify.post('/login', async (request, reply) => {
        try {
            const { email, password } = request.body;

            // Validate input
            if (!email || !password) {
                return reply.code(400).send({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Hardcoded credentials check
            const VALID_EMAIL = 'test@gmail.com';
            const VALID_PASSWORD = 'test@123';

            if (email.toLowerCase() !== VALID_EMAIL || password !== VALID_PASSWORD) {
                return reply.code(401).send({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Login successful
            return reply.code(200).send({
                success: true,
                message: 'Login successful',
                data: {
                    email: VALID_EMAIL
                }
            });

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                message: 'An error occurred during login',
                error: error.message
            });
        }
    });

    // POST /api/auth/logout - Simple logout
    fastify.post('/logout', async (request, reply) => {
        return reply.code(200).send({
            success: true,
            message: 'Logout successful'
        });
    });
}

module.exports = authRoutes;
