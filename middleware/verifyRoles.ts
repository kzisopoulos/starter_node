const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req?.roles) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const rolesArray = [...allowedRoles];

    const result = req.roles.map(role => rolesArray.includes(role)).find(value => value === true);
    if (!result) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
};

export { verifyRoles };
