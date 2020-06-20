module.exports = async (ctx, next) => {
  if (ctx.state.admin.id === ctx.state.user.id) {
    return await next();
  }

  ctx.unauthorized(`You're not allowed to perform this action!`);
};
