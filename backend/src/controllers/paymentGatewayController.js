const prisma = require('../prisma');
const response = require('../utils/response');

const listGateways = async (req, res, next) => {
  try {
    const gateways = await prisma.paymentGateway.findMany({
      orderBy: { sort_order: 'asc' },
    });
    response.success(res, gateways);
  } catch (error) {
    next(error);
  }
};

const updateGateway = async (req, res, next) => {
  try {
    const gateway = await prisma.paymentGateway.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!gateway) return response.notFound(res, 'Payment gateway not found');

    const { name, type, instructions, config, is_active, sort_order } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (instructions !== undefined) data.instructions = instructions;
    if (config !== undefined) data.config = config;
    if (is_active !== undefined) data.is_active = is_active;
    if (sort_order !== undefined) data.sort_order = sort_order;

    const updated = await prisma.paymentGateway.update({
      where: { id: gateway.id },
      data,
    });
    response.success(res, updated, 'Payment gateway updated');
  } catch (error) {
    next(error);
  }
};

module.exports = { listGateways, updateGateway };
