import numpy as np
import matplotlib.pyplot as plt


# Robot and target parameters
l1, l2, l3 = 1.0, 1.0, 1.0
x_target, y_target = 1.0, 2.0

# Numerical parameters
q1_values = np.linspace(-np.pi, np.pi, 40000)
reachability_tolerance = 1e-12
fk_tolerance = 1e-10


def forward_kinematics(q, link_lengths):
    """Return the planar 3R end-effector position."""
    q1, q2, q3 = q
    l1, l2, l3 = link_lengths

    theta1 = q1
    theta2 = q1 + q2
    theta3 = q1 + q2 + q3

    x = (
        l1 * np.cos(theta1)
        + l2 * np.cos(theta2)
        + l3 * np.cos(theta3)
    )
    y = (
        l1 * np.sin(theta1)
        + l2 * np.sin(theta2)
        + l3 * np.sin(theta3)
    )

    return np.array([x, y])


def wrap_to_pi(angle):
    """Wrap an angle to [-pi, pi)."""
    return (angle + np.pi) % (2.0 * np.pi) - np.pi


# Generate the one-dimensional IK manifold
branches = {+1: [], -1: []}

for q1 in q1_values:
    # Position of the first joint
    p1 = np.array([
        l1 * np.cos(q1),
        l1 * np.sin(q1),
    ])

    # Vector from joint 1 to the target
    target_vector = np.array([x_target, y_target]) - p1
    dx, dy = target_vector
    d_sq = dx**2 + dy**2

    # Reachability of the two-link subchain
    minimum_distance_sq = (l2 - l3) ** 2
    maximum_distance_sq = (l2 + l3) ** 2

    if not (
        minimum_distance_sq - reachability_tolerance
        <= d_sq
        <= maximum_distance_sq + reachability_tolerance
    ):
        continue

    # Relative angle between links 2 and 3
    cos_q3 = (d_sq - l2**2 - l3**2) / (2.0 * l2 * l3)
    cos_q3 = np.clip(cos_q3, -1.0, 1.0)
    sin_q3_abs = np.sqrt(max(0.0, 1.0 - cos_q3**2))

    for branch in (+1, -1):
        sin_q3 = branch * sin_q3_abs
        q3 = np.arctan2(sin_q3, cos_q3)

        # Absolute orientation of link 2
        q2_absolute = np.arctan2(dy, dx) - np.arctan2(
            l3 * np.sin(q3),
            l2 + l3 * np.cos(q3),
        )

        # Convert absolute link-2 orientation to relative joint angle
        q2 = wrap_to_pi(q2_absolute - q1)

        q = np.array([q1, q2, q3])
        position_error = np.linalg.norm(
            forward_kinematics(q, (l1, l2, l3))
            - np.array([x_target, y_target])
        )

        if position_error <= fk_tolerance:
            branches[branch].append(q)


# Convert lists to consistently shaped arrays
branches = {
    branch: np.asarray(values, dtype=float).reshape(-1, 3)
    for branch, values in branches.items()
}


# Verify all IK solutions
for branch, values in branches.items():
    if len(values) == 0:
        print(f"Branch {branch:+d}: no solutions")
        continue

    errors = np.array([
        np.linalg.norm(
            forward_kinematics(q, (l1, l2, l3))
            - np.array([x_target, y_target])
        )
        for q in values
    ])

    print(
        f"Branch {branch:+d}: "
        f"{len(values)} solutions, "
        f"maximum FK error = {errors.max():.3e}"
    )


# ---------------------------------------------------------------------
# Plot 1: configuration-space solution manifold
# ---------------------------------------------------------------------
fig_cspace = plt.figure(figsize=(10, 7))
ax_cspace = fig_cspace.add_subplot(111, projection="3d")

colors = {+1: "tab:blue", -1: "tab:orange"}

for branch, values in branches.items():
    if len(values) == 0:
        continue

    # Unwrap only for continuous visualization.
    q1_plot = np.unwrap(values[:, 0])
    q2_plot = np.unwrap(values[:, 1])
    q3_plot = np.unwrap(values[:, 2])

    ax_cspace.plot(
        q1_plot,
        q2_plot,
        q3_plot,
        color=colors[branch],
        linewidth=2,
        label=f"Elbow branch {branch:+d}",
    )

ax_cspace.set_title(
    f"Position-Only IK Manifold for Target "
    f"({x_target:.2f}, {y_target:.2f})"
)
ax_cspace.set_xlabel("q1 [rad]")
ax_cspace.set_ylabel("q2 [rad]")
ax_cspace.set_zlabel("q3 [rad]")
ax_cspace.legend()
ax_cspace.grid(True)


# ---------------------------------------------------------------------
# Plot 2: robot configuration for one manifold solution
# ---------------------------------------------------------------------
selected_branch = +1

if len(branches[selected_branch]) == 0:
    raise RuntimeError(
        f"Selected branch {selected_branch:+d} contains no solutions."
    )

solution_index = len(branches[selected_branch]) // 2
q = branches[selected_branch][solution_index]
q1, q2, q3 = q

theta1 = q1
theta2 = q1 + q2
theta3 = q1 + q2 + q3

p0 = np.array([0.0, 0.0])
p1 = p0 + l1 * np.array([np.cos(theta1), np.sin(theta1)])
p2 = p1 + l2 * np.array([np.cos(theta2), np.sin(theta2)])
p3 = p2 + l3 * np.array([np.cos(theta3), np.sin(theta3)])

target = np.array([x_target, y_target])
robot_error = np.linalg.norm(p3 - target)

fig_robot, ax_robot = plt.subplots(figsize=(7, 7))

points = np.vstack((p0, p1, p2, p3))

ax_robot.plot(
    points[:, 0],
    points[:, 1],
    "o-",
    linewidth=3,
    markersize=8,
    label="Robot",
)

ax_robot.plot(
    x_target,
    y_target,
    "rx",
    markersize=12,
    markeredgewidth=3,
    label="Target",
)

ax_robot.plot(
    p3[0],
    p3[1],
    "ko",
    markersize=5,
    label="End effector",
)

ax_robot.set_aspect("equal", adjustable="box")
ax_robot.set_xlim(-3.2, 3.2)
ax_robot.set_ylim(-3.2, 3.2)
ax_robot.grid(True)
ax_robot.set_xlabel("x")
ax_robot.set_ylabel("y")
ax_robot.set_title(
    f"Robot Configuration, branch {selected_branch:+d}\n"
    f"q = [{q1:.3f}, {q2:.3f}, {q3:.3f}] rad\n"
    f"FK error = {robot_error:.3e}"
)
ax_robot.legend()

plt.show()
