const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await db.query('SELECT * FROM users WHERE email = ?', [email]);

  if (!user.length) {
    return res.status(401).json({ message: 'User not found' });
  }

  const valid = await bcrypt.compare(password, user[0].password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });

  return res.json({
    token,
    user: {
      id: user[0].id,
      email: user[0].email,
      role: user[0].role 
    }
  });
};
