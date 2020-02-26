const {Router} = require('express');
const bcrypt = require('bcryptjs'); //сравнение и хеширование паролей
const config = require('config');
const jwt = require('jsonwebtoken');
const {check, validationResult} = require('express-validator');
const User = require('../models/User');
const router = Router();


// /api/auth/register
router.post(
  '/register',
  [
    check('email', 'Некорректный email').isEmail(),
    check('password', 'Минимальная длина пароля 6 символов')
      .isLength({ min: 6 })
  ],
  async (req, res) => {
    try{
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Некорректные данные при регистрации'
        })
      }

      const {email, password} = req.body;

      // проверка, есть ли такой email
      const candidate = await User.findOne({ email });

      if (candidate) {
        return res.status(400).json({ message: 'Такой пользователь уже существует' })
      }

      //регистрация нового пользователя
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({ email, password: hashedPassword }); //создать польз-я уже с хешированным паролем

      await user.save();

      //польз-ль создался, то
      res.status(201).json({ message: 'Пользователь создан' })

    } catch (e) {
      res.status(500).json({ message: ' Что-то пошло не так!' })
    }
});


// /api/auth/login
router.post(
  '/login',
  [
    check('email', 'Введите корректный email').normalizeEmail().isEmail(),
    check('password', 'Введите пароль').exists() //exists - пароль должен существовать
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Некорректный данные при входе в систему'
        })
      }

      const {email, password} = req.body; //получить из запроса поля: email, password

      const user = await User.findOne({ email }); //поиск польз-я с соответ-м email, если его нет, то не будет логина

      if (!user) {
        return res.status(400).json({ message: 'Пользователь не найден' })
      }

      //польз-я нашли, сравниваем пароли
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: 'Неверный пароль, попробуйте снова' })
      }

      //с польз-м все хорошо, нужно сделать его авторизацию
      const token = jwt.sign(
        { userId: user.id }, //1-ый параметр в виде объекта с зашифрованными данными в jwt токине
        config.get('jwtSecret'), //передаем секретный ключ из default.json
        { expiresIn: '1h' } //время существование jwt токена
      );

      res.json({ token, userId: user.id }) //завершение логина

    } catch (e) {
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' })
    }
  });


module.exports = router;
